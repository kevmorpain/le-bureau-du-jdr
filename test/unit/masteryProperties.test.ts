import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { createClient } from '@libsql/client'
import { MASTERY_PROPERTIES, masteryPropertyEnum } from '../../shared/rules/masteryProperties'
import { MASTERY_PROPERTY_CONTRACT } from '../fixtures/masteryProperties'

// La maîtrise d'armes 2024 a une seule source de vérité (la const
// shared/rules/masteryProperties.ts) dont la colonne `items.mastery_property` dérive.
// On vérifie l'ensemble/l'ordre contre le contrat, la validation Zod, et que la
// migration 0083 pose bien la colonne (nullable) sur une base peuplée.

const MIGRATIONS_DIR = fileURLToPath(new URL('../../server/db/migrations/', import.meta.url))
const NUXTHUB_UTILS = new URL('../../node_modules/@nuxthub/core/dist/db/lib/utils.mjs', import.meta.url)
const MIGRATION = '0083_backgrounds_features_items_mastery.sql'

describe('maîtrise d\'armes — const canonique', () => {
  it('MASTERY_PROPERTIES = l\'ensemble et l\'ordre du contrat', () => {
    expect([...MASTERY_PROPERTIES]).toEqual(MASTERY_PROPERTY_CONTRACT.map(c => c.key))
  })

  it('exactement 8 propriétés (les 8 des règles 2024)', () => {
    expect(MASTERY_PROPERTIES).toHaveLength(8)
  })

  it('masteryPropertyEnum valide chaque clé du contrat et rejette l\'inconnu', () => {
    for (const { key } of MASTERY_PROPERTY_CONTRACT) {
      expect(masteryPropertyEnum.parse(key)).toBe(key)
    }
    expect(masteryPropertyEnum.safeParse('entaille').success).toBe(false)
  })
})

describe('maîtrise d\'armes — migration 0083', () => {
  it('ajoute la colonne mastery_property (nullable) à items sur une base peuplée', async () => {
    const mod = await import(/* @vite-ignore */ NUXTHUB_UTILS.href)
    const splitSqlQueries = mod.splitSqlQueries as (sql: string) => string[]

    const db = createClient({ url: ':memory:' })
    await db.execute('PRAGMA foreign_keys = ON')
    // État d'avant 0083 : `items` sans la colonne + les parents FK de background_features
    // (le même fichier de migration crée cette table).
    await db.execute('CREATE TABLE items (id integer PRIMARY KEY NOT NULL, name text NOT NULL, item_type text NOT NULL)')
    await db.execute('CREATE TABLE backgrounds (id integer PRIMARY KEY NOT NULL, name text NOT NULL)')
    await db.execute('CREATE TABLE features (id integer PRIMARY KEY NOT NULL, name text NOT NULL)')
    await db.execute({ sql: 'INSERT INTO items (id, name, item_type) VALUES (?, ?, ?)', args: [1, 'Épée longue', 'weapon'] })

    const sql = await readFile(MIGRATIONS_DIR + MIGRATION, 'utf8')
    for (const statement of splitSqlQueries(sql)) {
      await db.execute(statement)
    }

    // La colonne existe et vaut NULL par défaut (pas de backfill) pour les armes 2014.
    const before = await db.execute('SELECT mastery_property FROM items WHERE id = 1')
    expect(before.rows[0]!.mastery_property).toBeNull()

    // Et elle accepte une valeur canonique.
    await db.execute({ sql: 'UPDATE items SET mastery_property = ? WHERE id = 1', args: [MASTERY_PROPERTIES[0]] })
    const after = await db.execute('SELECT mastery_property FROM items WHERE id = 1')
    expect(after.rows[0]!.mastery_property).toBe(MASTERY_PROPERTIES[0])
  })
})
