import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { createClient } from '@libsql/client'

// La table de jointure `background_features` (lot 4d) aligne les historiques sur le
// pattern espèce (`species_features`). Rien ne la seede encore (contenu 5.5 en Phase 2) :
// on vérifie donc le SCHÉMA que la migration 0083 pose — création, intégrité FK
// (cascade), et clef primaire composite — sur une base peuplée façon prod.

const MIGRATIONS_DIR = fileURLToPath(new URL('../../server/db/migrations/', import.meta.url))
const NUXTHUB_UTILS = new URL('../../node_modules/@nuxthub/core/dist/db/lib/utils.mjs', import.meta.url)
const MIGRATION = '0083_backgrounds_features_items_mastery.sql'

async function applyMigration(db: ReturnType<typeof createClient>) {
  const mod = await import(/* @vite-ignore */ NUXTHUB_UTILS.href)
  const splitSqlQueries = mod.splitSqlQueries as (sql: string) => string[]
  const sql = await readFile(MIGRATIONS_DIR + MIGRATION, 'utf8')
  for (const statement of splitSqlQueries(sql)) {
    await db.execute(statement)
  }
}

async function setup() {
  const db = createClient({ url: ':memory:' })
  await db.execute('PRAGMA foreign_keys = ON')
  // Parents FK, dans leur état minimal d'avant 0083 (colonnes lues par la jointure).
  await db.execute('CREATE TABLE backgrounds (id integer PRIMARY KEY NOT NULL, name text NOT NULL)')
  await db.execute('CREATE TABLE features (id integer PRIMARY KEY NOT NULL, name text NOT NULL)')
  await db.execute('CREATE TABLE items (id integer PRIMARY KEY NOT NULL, name text NOT NULL, item_type text NOT NULL)')
  await db.execute({ sql: 'INSERT INTO backgrounds (id, name) VALUES (?, ?)', args: [1, 'Acolyte'] })
  await db.execute({ sql: 'INSERT INTO features (id, name) VALUES (?, ?)', args: [1, 'Trait d\'historique'] })
  await applyMigration(db)
  return db
}

describe('background_features — migration 0083', () => {
  it('crée la table (vide, aucun seed)', async () => {
    const db = await setup()
    const rows = await db.execute('SELECT count(*) as c FROM background_features')
    expect(rows.rows[0]!.c).toBe(0)
  })

  it('accepte un lien historique ⇄ feature valide', async () => {
    const db = await setup()
    await db.execute({ sql: 'INSERT INTO background_features (background_id, feature_id) VALUES (?, ?)', args: [1, 1] })
    const rows = await db.execute('SELECT background_id, feature_id FROM background_features')
    expect(rows.rows).toHaveLength(1)
    expect(Number(rows.rows[0]!.background_id)).toBe(1)
    expect(Number(rows.rows[0]!.feature_id)).toBe(1)
  })

  it('rejette un feature_id inexistant (contrainte FK)', async () => {
    const db = await setup()
    await expect(
      db.execute({ sql: 'INSERT INTO background_features (background_id, feature_id) VALUES (?, ?)', args: [1, 999] }),
    ).rejects.toThrow(/FOREIGN KEY/i)
  })

  it('rejette un doublon (clef primaire composite)', async () => {
    const db = await setup()
    await db.execute({ sql: 'INSERT INTO background_features (background_id, feature_id) VALUES (?, ?)', args: [1, 1] })
    await expect(
      db.execute({ sql: 'INSERT INTO background_features (background_id, feature_id) VALUES (?, ?)', args: [1, 1] }),
    ).rejects.toThrow()
  })

  it('supprime les liens en cascade quand l\'historique est supprimé', async () => {
    const db = await setup()
    await db.execute({ sql: 'INSERT INTO background_features (background_id, feature_id) VALUES (?, ?)', args: [1, 1] })
    await db.execute('DELETE FROM backgrounds WHERE id = 1')
    const rows = await db.execute('SELECT count(*) as c FROM background_features')
    expect(rows.rows[0]!.c).toBe(0)
  })
})
