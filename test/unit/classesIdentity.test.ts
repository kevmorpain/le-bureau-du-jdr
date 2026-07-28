import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { createClient } from '@libsql/client'
import { classesData } from '../../server/db/seeds/data/classes'
import { CLASS_IDENTITY } from '../fixtures/classIdentity'

// Les faits d'identité de classe (niveau de sous-classe, type d'incantation) ont deux
// chemins d'arrivée en base : la MIGRATION 0080 pour les bases déjà déployées (on ne
// re-seede pas la prod) et le SEED pour les bases neuves. Les deux doivent produire
// exactement le contrat de `test/fixtures/classIdentity.ts`, sinon une fiche créée en
// prod et la même créée en local ne reçoivent pas les mêmes emplacements de sorts.

const MIGRATIONS_DIR = fileURLToPath(new URL('../../server/db/migrations/', import.meta.url))
const NUXTHUB_UTILS = new URL('../../node_modules/@nuxthub/core/dist/db/lib/utils.mjs', import.meta.url)
const MIGRATION = '0080_classes_identity_columns.sql'

describe('faits d\'identité de classe — seed', () => {
  it('les données de seed portent les valeurs du contrat', () => {
    const byName = new Map(classesData.map(c => [c.name, c]))

    expect(classesData).toHaveLength(CLASS_IDENTITY.length)
    for (const expected of CLASS_IDENTITY) {
      const seeded = byName.get(expected.dbName)
      expect(seeded, `classe ${expected.dbName} absente du seed`).toBeDefined()
      expect({
        subclassLevel: seeded!.subclassLevel,
        spellcastingType: seeded!.spellcastingType,
      }, expected.dbName).toEqual({
        subclassLevel: expected.subclassLevel,
        spellcastingType: expected.spellcastingType,
      })
    }
  })
})

describe('faits d\'identité de classe — migration 0080', () => {
  it('pose les colonnes ET les remplit sur une base déjà peuplée', async () => {
    const mod = await import(/* @vite-ignore */ NUXTHUB_UTILS.href)
    const splitSqlQueries = mod.splitSqlQueries as (sql: string) => string[]

    const files = (await readdir(MIGRATIONS_DIR))
      .filter(f => f.endsWith('.sql'))
      .sort()

    expect(files).toContain(MIGRATION)

    const db = createClient({ url: ':memory:' })
    await db.execute('PRAGMA foreign_keys = ON')

    // 1. On rejoue la chaîne JUSQU'AVANT la migration testée : on se place dans
    //    l'état du schéma de production au moment où elle s'appliquera.
    for (const file of files.filter(f => f < MIGRATION)) {
      const sql = await readFile(MIGRATIONS_DIR + file, 'utf8')
      for (const statement of splitSqlQueries(sql)) {
        await db.execute(statement)
      }
    }

    // 2. On peuple `classes` comme la prod l'est : les 12 classes, sans les colonnes
    //    d'identité (elles n'existent pas encore).
    for (const [i, cls] of classesData.entries()) {
      await db.execute({
        sql: 'INSERT INTO classes (id, name, hit_dice, spellcasting_ability) VALUES (?, ?, ?, ?)',
        args: [i + 1, cls.name, cls.hitDice, cls.spellcastingAbility],
      })
    }

    // 3. La migration doit se suffire à elle-même : colonnes + backfill.
    const sql = await readFile(MIGRATIONS_DIR + MIGRATION, 'utf8')
    for (const statement of splitSqlQueries(sql)) {
      await db.execute(statement)
    }

    const rows = await db.execute('SELECT name, subclass_level, spellcasting_type FROM classes ORDER BY id')
    const byName = new Map(rows.rows.map(r => [r.name as string, r]))

    expect(byName.size).toBe(CLASS_IDENTITY.length)
    for (const expected of CLASS_IDENTITY) {
      const row = byName.get(expected.dbName)
      expect(row, `classe ${expected.dbName} absente de la base`).toBeDefined()
      expect({
        subclassLevel: Number(row!.subclass_level),
        spellcastingType: row!.spellcasting_type,
      }, expected.dbName).toEqual({
        subclassLevel: expected.subclassLevel,
        spellcastingType: expected.spellcastingType,
      })
    }
  })

  it('applique des défauts sûrs à une classe inconnue de la migration', async () => {
    const mod = await import(/* @vite-ignore */ NUXTHUB_UTILS.href)
    const splitSqlQueries = mod.splitSqlQueries as (sql: string) => string[]

    const db = createClient({ url: ':memory:' })
    await db.execute('CREATE TABLE classes (id integer PRIMARY KEY NOT NULL, name text NOT NULL, hit_dice text NOT NULL)')
    await db.execute({
      sql: 'INSERT INTO classes (id, name, hit_dice) VALUES (?, ?, ?)',
      args: [1, 'Artificier', '1d8'],
    })

    const sql = await readFile(MIGRATIONS_DIR + MIGRATION, 'utf8')
    for (const statement of splitSqlQueries(sql)) {
      await db.execute(statement)
    }

    // Une classe hors PHB 2014 ne doit pas se voir accorder d'emplacements de sorts
    // par accident ; le niveau de sous-classe retombe sur 3 (règle unique en 5.5).
    const rows = await db.execute('SELECT subclass_level, spellcasting_type FROM classes')
    expect(rows.rows[0]!.spellcasting_type).toBe('none')
    expect(Number(rows.rows[0]!.subclass_level)).toBe(3)
  })
})
