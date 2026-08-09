import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { createClient } from '@libsql/client'
import { RULESETS, rulesetEnum } from '../../shared/rules/ruleset'

// Le discriminant d'édition a une seule source de vérité (la const
// shared/rules/ruleset.ts) dont les colonnes `ruleset` dérivent. On vérifie
// l'ensemble/l'ordre (contrat D12 : valeurs écrites à la main), la validation Zod, et
// que la migration 0084 pose bien la colonne (NOT NULL DEFAULT '5', donc backfill) sur
// une base peuplée — sur les 6 tables ciblées.

const MIGRATIONS_DIR = fileURLToPath(new URL('../../server/db/migrations/', import.meta.url))
const NUXTHUB_UTILS = new URL('../../node_modules/@nuxthub/core/dist/db/lib/utils.mjs', import.meta.url)
const MIGRATION = '0084_ruleset_discriminant.sql'
const MIGRATION_SPELLS = '0089_spells_ruleset.sql'

// Les 6 tables recevant `ruleset` (cf. dnd-5.5.md §3 / decisions.md D2). État minimal
// d'AVANT 0084 : la seule contrainte est que la table existe pour l'ALTER (SQLite
// ADD COLUMN ignore les autres colonnes).
const TARGET_TABLES = [
  'character_sheets',
  'character_species',
  'classes',
  'backgrounds',
  'features',
  'spell_classes',
] as const

describe('ruleset — const canonique', () => {
  it('RULESETS = l\'ensemble et l\'ordre du contrat', () => {
    expect([...RULESETS]).toEqual(['5', '5.5'])
  })

  it('exactement 2 éditions', () => {
    expect(RULESETS).toHaveLength(2)
  })

  it('rulesetEnum valide chaque valeur et rejette l\'inconnu', () => {
    for (const value of RULESETS) {
      expect(rulesetEnum.parse(value)).toBe(value)
    }
    expect(rulesetEnum.safeParse('6').success).toBe(false)
    expect(rulesetEnum.safeParse('5e').success).toBe(false)
  })
})

describe('ruleset — migration 0084', () => {
  it('ajoute la colonne ruleset (DEFAULT \'5\' NOT NULL) et backfille les lignes existantes', async () => {
    const mod = await import(/* @vite-ignore */ NUXTHUB_UTILS.href)
    const splitSqlQueries = mod.splitSqlQueries as (sql: string) => string[]

    const db = createClient({ url: ':memory:' })
    await db.execute('PRAGMA foreign_keys = ON')

    // État d'avant 0084 : les 6 tables sans la colonne, chacune avec une ligne existante
    // (= donnée 2014 à backfiller).
    await db.execute('CREATE TABLE character_sheets (id integer PRIMARY KEY NOT NULL, name text NOT NULL)')
    await db.execute('CREATE TABLE character_species (id integer PRIMARY KEY NOT NULL, name text NOT NULL)')
    await db.execute('CREATE TABLE classes (id integer PRIMARY KEY NOT NULL, name text NOT NULL)')
    await db.execute('CREATE TABLE backgrounds (id integer PRIMARY KEY NOT NULL, name text NOT NULL)')
    await db.execute('CREATE TABLE features (id integer PRIMARY KEY NOT NULL, name text NOT NULL)')
    await db.execute('CREATE TABLE spell_classes (spell_id integer NOT NULL, class_id integer NOT NULL)')

    await db.execute('INSERT INTO character_sheets (id, name) VALUES (1, \'Ambroise\')')
    await db.execute('INSERT INTO character_species (id, name) VALUES (1, \'Elfe\')')
    await db.execute('INSERT INTO classes (id, name) VALUES (1, \'Magicien\')')
    await db.execute('INSERT INTO backgrounds (id, name) VALUES (1, \'Sage\')')
    await db.execute('INSERT INTO features (id, name) VALUES (1, \'Vision dans le noir\')')
    await db.execute('INSERT INTO spell_classes (spell_id, class_id) VALUES (1, 1)')

    const sql = await readFile(MIGRATIONS_DIR + MIGRATION, 'utf8')
    for (const statement of splitSqlQueries(sql)) {
      await db.execute(statement)
    }

    // Chaque table a la colonne, et la ligne préexistante a été backfillée à '5'.
    for (const table of TARGET_TABLES) {
      const res = await db.execute(`SELECT ruleset FROM ${table} LIMIT 1`)
      expect(res.rows[0]!.ruleset, `${table}.ruleset backfillé`).toBe('5')
    }

    // La colonne accepte l'autre valeur canonique (contenu 5.5, Phase 2).
    await db.execute('UPDATE classes SET ruleset = \'5.5\' WHERE id = 1')
    const updated = await db.execute('SELECT ruleset FROM classes WHERE id = 1')
    expect(updated.rows[0]!.ruleset).toBe('5.5')
  })
})

describe('ruleset — migration 0089 (spells)', () => {
  it('pose spells.ruleset (DEFAULT \'5\' NOT NULL), backfille l\'existant, accepte \'5.5\'', async () => {
    const mod = await import(/* @vite-ignore */ NUXTHUB_UTILS.href)
    const splitSqlQueries = mod.splitSqlQueries as (sql: string) => string[]

    const db = createClient({ url: ':memory:' })
    // État d'avant 0089 : la table spells sans la colonne, avec un sort 2014 existant.
    await db.execute('CREATE TABLE spells (id integer PRIMARY KEY NOT NULL, name text NOT NULL)')
    await db.execute('INSERT INTO spells (id, name) VALUES (1, \'Boule de feu\')')

    const sql = await readFile(MIGRATIONS_DIR + MIGRATION_SPELLS, 'utf8')
    for (const statement of splitSqlQueries(sql)) {
      await db.execute(statement)
    }

    const backfilled = await db.execute('SELECT ruleset FROM spells WHERE id = 1')
    expect(backfilled.rows[0]!.ruleset, 'spells.ruleset backfillé à 5').toBe('5')

    // Duplication par édition : une 2ᵉ ligne « Boule de feu » 5.5 coexiste (contenu divergent).
    await db.execute('INSERT INTO spells (id, name, ruleset) VALUES (2, \'Boule de feu\', \'5.5\')')
    const both = await db.execute('SELECT ruleset FROM spells ORDER BY id')
    expect(both.rows.map(r => r.ruleset)).toEqual(['5', '5.5'])
  })
})
