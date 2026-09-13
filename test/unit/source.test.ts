import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { createClient } from '@libsql/client'
import { SOURCES, sourceEnum, CORE_SOURCE, isGatedSource } from '../../shared/rules/source'

// Le discriminant de provenance/visibilité a une seule source de vérité (la const
// shared/rules/source.ts) dont les colonnes `source` dérivent. On vérifie l'ensemble,
// la validation Zod, la dérivation de gating (isGatedSource), et que la migration 0096
// pose bien la colonne (NOT NULL DEFAULT 'core', donc backfill) sur les 8 tables ciblées.

const MIGRATIONS_DIR = fileURLToPath(new URL('../../server/db/migrations/', import.meta.url))
const NUXTHUB_UTILS = new URL('../../node_modules/@nuxthub/core/dist/db/lib/utils.mjs', import.meta.url)
const MIGRATION = '0096_source_discriminant.sql'

// Les 8 tables d'entités du catalogue recevant `source`. État minimal d'AVANT 0093 : la
// seule contrainte est que la table existe pour l'ALTER (SQLite ADD COLUMN ignore le reste).
const TARGET_TABLES = [
  'character_species',
  'species_lineages',
  'classes',
  'subclasses',
  'backgrounds',
  'features',
  'spells',
  'items',
] as const

describe('source — const canonique', () => {
  it('contient le socle et les extensions attendues', () => {
    expect(SOURCES).toContain('core')
    expect(SOURCES).toContain('tasha')
    expect(SOURCES).toContain('homebrew')
  })

  it('CORE_SOURCE est le socle et appartient à SOURCES', () => {
    expect(CORE_SOURCE).toBe('core')
    expect(SOURCES).toContain(CORE_SOURCE)
  })

  it('sourceEnum valide chaque valeur et rejette l\'inconnu', () => {
    for (const value of SOURCES) {
      expect(sourceEnum.parse(value)).toBe(value)
    }
    expect(sourceEnum.safeParse('phb').success).toBe(false)
    expect(sourceEnum.safeParse('').success).toBe(false)
  })

  it('isGatedSource : le socle est visible, tout le reste est gaté', () => {
    expect(isGatedSource('core')).toBe(false)
    for (const value of SOURCES.filter(s => s !== 'core')) {
      expect(isGatedSource(value), `${value} gaté`).toBe(true)
    }
  })
})

describe('source — migration 0096', () => {
  it('ajoute la colonne source (DEFAULT \'core\' NOT NULL) et backfille les lignes existantes', async () => {
    const mod = await import(/* @vite-ignore */ NUXTHUB_UTILS.href)
    const splitSqlQueries = mod.splitSqlQueries as (sql: string) => string[]

    const db = createClient({ url: ':memory:' })
    await db.execute('PRAGMA foreign_keys = ON')

    // État d'avant 0093 : les 8 tables sans la colonne, chacune avec une ligne existante
    // (= donnée à backfiller à 'core').
    for (const table of TARGET_TABLES) {
      await db.execute(`CREATE TABLE ${table} (id integer PRIMARY KEY NOT NULL, name text NOT NULL)`)
      await db.execute(`INSERT INTO ${table} (id, name) VALUES (1, 'x')`)
    }

    const sql = await readFile(MIGRATIONS_DIR + MIGRATION, 'utf8')
    for (const statement of splitSqlQueries(sql)) {
      await db.execute(statement)
    }

    // Chaque table a la colonne, et la ligne préexistante a été backfillée à 'core'.
    for (const table of TARGET_TABLES) {
      const res = await db.execute(`SELECT source FROM ${table} LIMIT 1`)
      expect(res.rows[0]!.source, `${table}.source backfillé`).toBe('core')
    }

    // La colonne accepte une valeur d'extension (contenu gaté à venir).
    await db.execute('UPDATE spells SET source = \'tasha\' WHERE id = 1')
    const updated = await db.execute('SELECT source FROM spells WHERE id = 1')
    expect(updated.rows[0]!.source).toBe('tasha')
  })
})
