import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { barbareFeatures, BARBARIAN_QUICK_MOVEMENT, BARBARIAN_UNARMORED_DEFENSE } from '../../server/db/seeds/data/barbare'
import { moineFeatures, MONK_UNARMORED_DEFENSE, MONK_UNARMORED_MOVEMENT } from '../../server/db/seeds/data/moine'
import { DRACONIC_RESILIENCE } from '../../server/db/seeds/data/ensorceleur'
import type { FeatureDef } from '../../server/db/seeds/lib/seedClass'
import { applyMigration, replayMigrations } from '../fixtures/migrations'

// Migration 0123 : pose les effets de CA sans armure et de bonus de vitesse sur les features déployées, et requalifie
// en `speed_bonus` les `walking_speed` utilisés comme bonus (don Mobile, objets), sans toucher aux vitesses de base des
// espèces. Les deux chemins (seed, migration) doivent produire les mêmes données, même rejouée.

const MIGRATION = '0123_armor_class_and_speed_effects.sql'

let client: Client
const ids: Record<string, number> = {}

const effectsOf = async (featureId: number) => {
  const res = await client.execute({
    sql: 'SELECT e.type, e.value FROM feature_effects fe JOIN effects e ON e.id = fe.effect_id WHERE fe.feature_id = ? ORDER BY e.type',
    args: [featureId],
  })
  return res.rows.map(r => ({ type: String(r.type), value: JSON.parse(String(r.value)) }))
}

const insert = async (sql: string, args: (string | number | null)[] = []) =>
  Number((await client.execute({ sql, args })).lastInsertRowid)

const effect = (type: string, value: unknown) =>
  insert('INSERT INTO effects (type, value) VALUES (?, ?)', [type, JSON.stringify(value)])

const feature = (name: string, type: string, level: number | null, classId: number | null, subclassId: number | null = null) =>
  insert(
    'INSERT INTO features (name, description, feature_type, class_id, subclass_id, level_required) VALUES (?, ?, ?, ?, ?, ?)',
    [name, 'description', type, classId, subclassId, level],
  )

beforeAll(async () => {
  client = createClient({ url: ':memory:' })
  await replayMigrations(client, { before: MIGRATION })
  await client.execute('PRAGMA foreign_keys = OFF')

  const barbarian = await insert('INSERT INTO classes (name, hit_dice) VALUES (?, ?)', ['Barbare', '1d12'])
  const monk = await insert('INSERT INTO classes (name, hit_dice) VALUES (?, ?)', ['Moine', '1d8'])
  const sorcerer = await insert('INSERT INTO classes (name, hit_dice) VALUES (?, ?)', ['Ensorceleur', '1d6'])
  const barbarian55 = await insert('INSERT INTO classes (name, hit_dice, ruleset) VALUES (?, ?, ?)', ['Barbare', '1d12', '5.5'])
  const draconic = await insert('INSERT INTO subclasses (class_id, name) VALUES (?, ?)', [sorcerer, 'Lignée draconique'])

  ids.barbarianDefense = await feature('Défense sans armure', 'class_feature', 1, barbarian)
  ids.quickMovement = await feature('Déplacement rapide', 'class_feature', 5, barbarian)
  ids.monkDefense = await feature('Défense sans armure', 'class_feature', 1, monk)
  ids.monkMovement = await feature('Déplacement sans armure', 'class_feature', 2, monk)
  ids.draconic = await feature('Résistance draconique', 'subclass_feature', 1, null, draconic)
  ids.homonym55 = await feature('Défense sans armure', 'class_feature', 1, barbarian55)

  // Le 9 est partagé : vitesse de base d'une espèce ET bonus d'un objet personnalisé.
  const speed9 = await effect('walking_speed', 9)
  const speed3 = await effect('walking_speed', 3)
  ids.speciesSpeed = await feature('Vitesse', 'species_trait', null, null)
  await client.execute({ sql: 'INSERT INTO feature_effects (feature_id, effect_id) VALUES (?, ?)', args: [ids.speciesSpeed, speed9] })
  ids.mobile = await feature('Mobile', 'feat', null, null)
  await client.execute({ sql: 'INSERT INTO feature_effects (feature_id, effect_id) VALUES (?, ?)', args: [ids.mobile, speed3] })
  ids.boots = await insert(`INSERT INTO items (name, item_type, properties, is_custom) VALUES ('Bottes', 'equipment', '{"category":"x"}', 1)`)
  await client.execute({ sql: 'INSERT INTO item_effects (item_id, effect_id) VALUES (?, ?)', args: [ids.boots, speed9] })

  for (let pass = 0; pass < 2; pass++) await applyMigration(client, MIGRATION)
})

const seedEffects = (features: FeatureDef[], name: string, level: number) =>
  features.find(f => f.name === name && f.levelRequired === level)!.effects

describe('migration 0123 — CA sans armure et vitesse', () => {
  it('Barbare : Défense sans armure et Déplacement rapide, comme le seed', async () => {
    expect(await effectsOf(ids.barbarianDefense!)).toEqual(seedEffects(barbareFeatures, 'Défense sans armure', 1))
    expect(await effectsOf(ids.quickMovement!)).toEqual(seedEffects(barbareFeatures, 'Déplacement rapide', 5))
    expect(seedEffects(barbareFeatures, 'Défense sans armure', 1)).toEqual([{ type: 'unarmored_defense', value: BARBARIAN_UNARMORED_DEFENSE }])
    expect(seedEffects(barbareFeatures, 'Déplacement rapide', 5)).toEqual([{ type: 'speed_bonus', value: BARBARIAN_QUICK_MOVEMENT }])
  })

  it('Moine : Défense sans armure et Déplacement sans armure, comme le seed', async () => {
    expect(await effectsOf(ids.monkDefense!)).toEqual(seedEffects(moineFeatures, 'Défense sans armure', 1))
    expect(await effectsOf(ids.monkMovement!)).toEqual(seedEffects(moineFeatures, 'Déplacement sans armure', 2))
    expect(seedEffects(moineFeatures, 'Défense sans armure', 1)).toEqual([{ type: 'unarmored_defense', value: MONK_UNARMORED_DEFENSE }])
    expect(seedEffects(moineFeatures, 'Déplacement sans armure', 2)).toEqual([{ type: 'speed_bonus', value: MONK_UNARMORED_MOVEMENT }])
  })

  it('Résistance draconique : 13 + DEX', async () => {
    expect(await effectsOf(ids.draconic!)).toEqual([{ type: 'unarmored_defense', value: DRACONIC_RESILIENCE }])
  })

  it('ne touche pas l\'homonyme de l\'édition 2024', async () => {
    expect(await effectsOf(ids.homonym55!)).toEqual([])
  })

  it('le don Mobile et l\'objet passent en speed_bonus, la vitesse de base de l\'espèce reste walking_speed', async () => {
    expect(await effectsOf(ids.mobile!)).toEqual([{ type: 'speed_bonus', value: { amount: { op: 'fixed', value: 3 } } }])
    const boots = await client.execute({
      sql: 'SELECT e.type, e.value FROM item_effects ie JOIN effects e ON e.id = ie.effect_id WHERE ie.item_id = ?',
      args: [ids.boots!],
    })
    expect(boots.rows.map(r => ({ type: String(r.type), value: JSON.parse(String(r.value)) })))
      .toEqual([{ type: 'speed_bonus', value: { amount: { op: 'fixed', value: 9 } } }])
    expect(await effectsOf(ids.speciesSpeed!)).toEqual([{ type: 'walking_speed', value: 9 }])
  })

  it('rejouée, ne duplique rien et supprime la vitesse orpheline du don', async () => {
    const count = async (type: string) =>
      Number((await client.execute({ sql: 'SELECT count(*) AS c FROM effects WHERE type = ?', args: [type] })).rows[0]!.c)
    expect(await count('unarmored_defense')).toBe(3)
    expect(await count('speed_bonus')).toBe(4)
    expect(await count('walking_speed')).toBe(1)
  })
})
