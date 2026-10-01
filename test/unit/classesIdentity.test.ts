import { describe, it, expect } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { classesData } from '../../server/db/seeds/data/classes'
import { CLASS_IDENTITY } from '../fixtures/classIdentity'
import { applyMigration, migrationFiles, replayMigrations } from '../fixtures/migrations'

// Les faits d'identité de classe (niveau de sous-classe, type d'incantation, compétences et prérequis
// de multiclassage) ont deux chemins d'arrivée en base : une MIGRATION pour les bases déjà déployées
// (on ne re-seede pas la prod) et le SEED pour les bases neuves. Les deux doivent produire
// exactement le contrat de `test/fixtures/classIdentity.ts`, sinon une fiche créée en
// prod et la même créée en local ne reçoivent pas les mêmes emplacements de sorts.

const MIGRATION = '0080_classes_identity_columns.sql'
const MULTICLASS_MIGRATION = '0103_classes_multiclass_skill_count.sql'
const PREREQUISITES_MIGRATION = '0106_classes_multiclass_prerequisites.sql'

/** Rejoue la chaîne JUSQU'AVANT `migration` : l'état du schéma de prod au moment où elle s'appliquera. */
async function dbBefore(migration: string): Promise<Client> {
  expect(await migrationFiles()).toContain(migration)

  const db = createClient({ url: ':memory:' })
  await db.execute('PRAGMA foreign_keys = ON')
  await replayMigrations(db, { before: migration })
  return db
}

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
        multiclassSkillCount: seeded!.multiclassSkillCount,
        multiclassPrerequisites: seeded!.multiclassPrerequisites,
      }, expected.dbName).toEqual({
        subclassLevel: expected.subclassLevel,
        spellcastingType: expected.spellcastingType,
        multiclassSkillCount: expected.multiclassSkillCount,
        multiclassPrerequisites: expected.multiclassPrerequisites,
      })
    }
  })
})

describe('faits d\'identité de classe — migration 0080', () => {
  it('pose les colonnes ET les remplit sur une base déjà peuplée', async () => {
    const db = await dbBefore(MIGRATION)

    // On peuple `classes` comme la prod l'est : les 12 classes, sans les colonnes
    // d'identité (elles n'existent pas encore).
    for (const [i, cls] of classesData.entries()) {
      await db.execute({
        sql: 'INSERT INTO classes (id, name, hit_dice, spellcasting_ability) VALUES (?, ?, ?, ?)',
        args: [i + 1, cls.name, cls.hitDice, cls.spellcastingAbility],
      })
    }

    // La migration doit se suffire à elle-même : colonnes + backfill.
    await applyMigration(db, MIGRATION)

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
    const db = createClient({ url: ':memory:' })
    await db.execute('CREATE TABLE classes (id integer PRIMARY KEY NOT NULL, name text NOT NULL, hit_dice text NOT NULL)')
    await db.execute({
      sql: 'INSERT INTO classes (id, name, hit_dice) VALUES (?, ?, ?)',
      args: [1, 'Artificier', '1d8'],
    })

    await applyMigration(db, MIGRATION)

    // Une classe hors PHB 2014 ne doit pas se voir accorder d'emplacements de sorts
    // par accident ; le niveau de sous-classe retombe sur 3 (règle unique en 5.5).
    const rows = await db.execute('SELECT subclass_level, spellcasting_type FROM classes')
    expect(rows.rows[0]!.spellcasting_type).toBe('none')
    expect(Number(rows.rows[0]!.subclass_level)).toBe(3)
  })
})

describe('faits d\'identité de classe — migration 0103 (compétences de multiclassage)', () => {
  it('pose la colonne ET la remplit pour les 12 classes 2014, sans toucher un homonyme 5.5', async () => {
    const db = await dbBefore(MULTICLASS_MIGRATION)

    for (const [i, cls] of classesData.entries()) {
      await db.execute({
        sql: 'INSERT INTO classes (id, name, hit_dice) VALUES (?, ?, ?)',
        args: [i + 1, cls.name, cls.hitDice],
      })
    }
    await db.execute({
      sql: 'INSERT INTO classes (id, name, hit_dice, ruleset) VALUES (?, ?, ?, ?)',
      args: [100, 'Barde', '1d8', '5.5'],
    })

    await applyMigration(db, MULTICLASS_MIGRATION)

    const rows = await db.execute('SELECT name, multiclass_skill_count FROM classes WHERE ruleset = \'5\' ORDER BY id')
    const byName = new Map(rows.rows.map(r => [r.name as string, Number(r.multiclass_skill_count)]))
    expect(byName.size).toBe(CLASS_IDENTITY.length)
    for (const expected of CLASS_IDENTITY) {
      expect(byName.get(expected.dbName), expected.dbName).toBe(expected.multiclassSkillCount)
    }

    const homonym = await db.execute('SELECT multiclass_skill_count FROM classes WHERE id = 100')
    expect(Number(homonym.rows[0]!.multiclass_skill_count)).toBe(0)
  })
})

describe('faits d\'identité de classe — migration 0106 (prérequis de multiclassage)', () => {
  it('pose la colonne ET la remplit pour les 12 classes 2014, sans toucher un homonyme 5.5', async () => {
    const db = await dbBefore(PREREQUISITES_MIGRATION)

    for (const [i, cls] of classesData.entries()) {
      await db.execute({
        sql: 'INSERT INTO classes (id, name, hit_dice) VALUES (?, ?, ?)',
        args: [i + 1, cls.name, cls.hitDice],
      })
    }
    await db.execute({
      sql: 'INSERT INTO classes (id, name, hit_dice, ruleset) VALUES (?, ?, ?, ?)',
      args: [100, 'Guerrier', '1d10', '5.5'],
    })

    await applyMigration(db, PREREQUISITES_MIGRATION)

    const rows = await db.execute('SELECT name, multiclass_prerequisites FROM classes WHERE ruleset = \'5\' ORDER BY id')
    const byName = new Map(rows.rows.map(r => [r.name as string, JSON.parse(String(r.multiclass_prerequisites))]))
    expect(byName.size).toBe(CLASS_IDENTITY.length)
    for (const expected of CLASS_IDENTITY) {
      expect(byName.get(expected.dbName), expected.dbName).toEqual(expected.multiclassPrerequisites)
    }

    const homonym = await db.execute('SELECT multiclass_prerequisites FROM classes WHERE id = 100')
    expect(JSON.parse(String(homonym.rows[0]!.multiclass_prerequisites))).toEqual([])
  })
})
