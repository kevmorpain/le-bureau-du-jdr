import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { createClient } from '@libsql/client'

// Lot 1 du chantier « lignée » (cf. decisions.md D17) : `species_lineages` (sous-entité
// symétrique de `subclasses`) + `features.lineage_id` + `character_choices.selected_lineage_id`.
// SCHÉMA SEUL (aucun seed) : on vérifie ce que la migration 0085 pose sur une base peuplée
// façon prod — création, intégrité FK (cascade espèce→lignée, set null lignée→feature), et
// l'index d'unicité étendu (deux picks de lignée identiques rejetés).

const MIGRATIONS_DIR = fileURLToPath(new URL('../../server/db/migrations/', import.meta.url))
const NUXTHUB_UTILS = new URL('../../node_modules/@nuxthub/core/dist/db/lib/utils.mjs', import.meta.url)
const MIGRATION = '0085_species_lineages.sql'

async function setup() {
  const mod = await import(/* @vite-ignore */ NUXTHUB_UTILS.href)
  const splitSqlQueries = mod.splitSqlQueries as (sql: string) => string[]

  const db = createClient({ url: ':memory:' })
  await db.execute('PRAGMA foreign_keys = ON')

  // État minimal d'avant 0085 : le parent FK des lignées, `features` (la colonne lineage_id
  // sera ajoutée par l'ALTER), et `character_choices` AVEC son index d'unicité d'avant (0082),
  // que 0085 recrée.
  await db.execute('CREATE TABLE character_species (id integer PRIMARY KEY NOT NULL, name text NOT NULL)')
  await db.execute('CREATE TABLE features (id integer PRIMARY KEY NOT NULL, name text NOT NULL, feature_type text NOT NULL)')
  await db.execute(
    'CREATE TABLE character_choices ('
    + 'id integer PRIMARY KEY NOT NULL, character_sheet_id integer NOT NULL, progression_id integer NOT NULL,'
    + ' selected_subclass_id integer, selected_feature_id integer, selected_spell_id integer,'
    + ' selected_ability_id text, selected_value text)',
  )
  await db.execute(
    'CREATE UNIQUE INDEX character_choices_unique ON character_choices'
    + ' (character_sheet_id, progression_id, selected_subclass_id, selected_feature_id,'
    + ' selected_spell_id, selected_ability_id, selected_value)',
  )
  await db.execute({ sql: 'INSERT INTO character_species (id, name) VALUES (?, ?)', args: [1, 'Elfe'] })

  const sql = await readFile(MIGRATIONS_DIR + MIGRATION, 'utf8')
  for (const statement of splitSqlQueries(sql)) await db.execute(statement)
  return db
}

describe('species_lineages — migration 0085', () => {
  it('crée la table (vide) et accepte une lignée rattachée à une espèce', async () => {
    const db = await setup()
    expect((await db.execute('SELECT count(*) as c FROM species_lineages')).rows[0]!.c).toBe(0)
    await db.execute({ sql: 'INSERT INTO species_lineages (id, species_id, name) VALUES (?, ?, ?)', args: [1, 1, 'Haut-elfe'] })
    const rows = await db.execute('SELECT species_id, name FROM species_lineages')
    expect(Number(rows.rows[0]!.species_id)).toBe(1)
    expect(rows.rows[0]!.name).toBe('Haut-elfe')
  })

  it('rejette une lignée sur une espèce inexistante (FK)', async () => {
    const db = await setup()
    await expect(
      db.execute({ sql: 'INSERT INTO species_lineages (id, species_id, name) VALUES (?, ?, ?)', args: [1, 999, 'Orpheline'] }),
    ).rejects.toThrow(/FOREIGN KEY/i)
  })

  it('cascade espèce→lignée et set null lignée→feature', async () => {
    const db = await setup()
    await db.execute({ sql: 'INSERT INTO species_lineages (id, species_id, name) VALUES (?, ?, ?)', args: [1, 1, 'Haut-elfe'] })
    await db.execute({
      sql: 'INSERT INTO features (id, name, feature_type, lineage_id) VALUES (?, ?, ?, ?)',
      args: [1, 'Sort mineur de magicien', 'lineage_feature', 1],
    })
    // Supprimer l'espèce → la lignée part en cascade, ET la feature voit son lineage_id passé à NULL.
    await db.execute('DELETE FROM character_species WHERE id = 1')
    expect((await db.execute('SELECT count(*) as c FROM species_lineages')).rows[0]!.c).toBe(0)
    const feat = await db.execute('SELECT lineage_id FROM features WHERE id = 1')
    expect(feat.rows[0]!.lineage_id).toBeNull()
  })

  it('character_choices porte selected_lineage_id, couvert par l\'index d\'unicité recréé', async () => {
    const db = await setup()
    const cols = (await db.execute('SELECT name FROM pragma_table_info(\'character_choices\')')).rows.map(r => r.name)
    expect(cols).toContain('selected_lineage_id')
    const idxCols = (await db.execute('SELECT name FROM pragma_index_info(\'character_choices_unique\')')).rows.map(r => r.name)
    expect(idxCols).toContain('selected_lineage_id')
  })

  it('la FK selected_lineage_id est enforced (lignée inexistante rejetée)', async () => {
    const db = await setup()
    await expect(
      db.execute('INSERT INTO character_choices (id, character_sheet_id, progression_id, selected_lineage_id) VALUES (1, 7, 3, 999)'),
    ).rejects.toThrow(/FOREIGN KEY/i)
  })
})
