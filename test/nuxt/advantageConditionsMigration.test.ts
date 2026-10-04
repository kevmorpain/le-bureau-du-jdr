import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { barbareFeatures, RECKLESS_ATTACK_DESCRIPTION } from '../../server/db/seeds/data/barbare'
import { roublardFeatures } from '../../server/db/seeds/data/roublard'
import type { FeatureDef } from '../../server/db/seeds/lib/seedClass'
import { applyMigration, replayMigrations } from '../fixtures/migrations'

// Migration 0125 : Attaque téméraire devient activable, Sens du danger gagne sa restriction, l'Attaque sournoise sait
// qu'elle dépend de l'avantage. Les deux chemins (seed, migration) doivent produire les mêmes données, même rejouée.

const MIGRATION = '0125_advantage_conditions.sql'

let client: Client
const ids: Record<string, number> = {}

const insert = async (sql: string, args: (string | number | null)[] = []) =>
  Number((await client.execute({ sql, args })).lastInsertRowid)

const feature = (name: string, level: number, classId: number) =>
  insert(
    'INSERT INTO features (name, description, feature_type, class_id, level_required) VALUES (?, ?, ?, ?, ?)',
    [name, 'ancienne description', 'class_feature', classId, level],
  )

const effectsOf = async (featureId: number) => {
  const res = await client.execute({
    sql: 'SELECT e.type, e.value FROM feature_effects fe JOIN effects e ON e.id = fe.effect_id WHERE fe.feature_id = ?',
    args: [featureId],
  })
  return res.rows.map(r => ({ type: String(r.type), value: JSON.parse(String(r.value)) }))
}

const rowOf = async (featureId: number) => {
  const r = (await client.execute({ sql: 'SELECT description, meta, action_type FROM features WHERE id = ?', args: [featureId] })).rows[0]!
  return { description: String(r.description), meta: r.meta == null ? null : JSON.parse(String(r.meta)), actionType: r.action_type == null ? null : String(r.action_type) }
}

const seed = (features: FeatureDef[], name: string, level: number) =>
  features.find(f => f.name === name && f.levelRequired === level)!

beforeAll(async () => {
  client = createClient({ url: ':memory:' })
  await replayMigrations(client, { before: MIGRATION })
  await client.execute('PRAGMA foreign_keys = OFF')

  const barbarian = await insert('INSERT INTO classes (name, hit_dice) VALUES (?, ?)', ['Barbare', '1d12'])
  const rogue = await insert('INSERT INTO classes (name, hit_dice) VALUES (?, ?)', ['Roublard', '1d8'])
  const barbarian55 = await insert('INSERT INTO classes (name, hit_dice, ruleset) VALUES (?, ?, ?)', ['Barbare', '1d12', '5.5'])

  ids.reckless = await feature('Attaque téméraire', 2, barbarian)
  ids.dangerSense = await feature('Sens du danger', 2, barbarian)
  ids.sneak = await feature('Attaque sournoise', 1, rogue)
  ids.homonym55 = await feature('Attaque téméraire', 2, barbarian55)

  // Ce que la base portait avant : la Sournoise sans `needsAdvantage`.
  const { needsAdvantage: _later, ...before } = seed(roublardFeatures, 'Attaque sournoise', 1).effects![0]!.value as Record<string, unknown>
  const sneakEffect = await insert('INSERT INTO effects (type, value) VALUES (?, ?)', ['weapon_damage_dice', JSON.stringify(before)])
  await client.execute({ sql: 'INSERT INTO feature_effects (feature_id, effect_id) VALUES (?, ?)', args: [ids.sneak, sneakEffect] })

  for (let pass = 0; pass < 2; pass++) await applyMigration(client, MIGRATION)
})

describe('migration 0125 — conditions d\'avantage', () => {
  it('Attaque téméraire : capacité libre qui s\'active, comme le seed', async () => {
    const def = seed(barbareFeatures, 'Attaque téméraire', 2)
    const row = await rowOf(ids.reckless!)
    expect(row.actionType).toBe(def.actionType)
    expect(row.meta).toEqual(def.meta)
    expect(row.meta.endsOnNewTurn).toBe(true)
  })

  it('Attaque téméraire : la description d\'AideDD remplace « premier tour de chaque combat »', async () => {
    const row = await rowOf(ids.reckless!)
    expect(row.description).toBe(RECKLESS_ATTACK_DESCRIPTION)
    expect(row.description).toBe(seed(barbareFeatures, 'Attaque téméraire', 2).description)
    expect(row.description).not.toContain('chaque combat')
  })

  it('Sens du danger : l\'avantage et ses états exclus, comme le seed', async () => {
    expect(await effectsOf(ids.dangerSense!)).toEqual(seed(barbareFeatures, 'Sens du danger', 2).effects)
  })

  it('Attaque sournoise : `needsAdvantage` posé sur l\'effet, comme le seed', async () => {
    expect(await effectsOf(ids.sneak!)).toEqual(seed(roublardFeatures, 'Attaque sournoise', 1).effects)
  })

  it('ne touche pas l\'homonyme de l\'édition 2024', async () => {
    const row = await rowOf(ids.homonym55!)
    expect(row).toMatchObject({ description: 'ancienne description', meta: null, actionType: null })
  })

  it('rejouée, ne duplique rien', async () => {
    const count = async (type: string) =>
      Number((await client.execute({ sql: 'SELECT count(*) AS c FROM effects WHERE type = ?', args: [type] })).rows[0]!.c)
    expect(await count('advantage')).toBe(1)
    expect(await count('weapon_damage_dice')).toBe(1)
  })
})
