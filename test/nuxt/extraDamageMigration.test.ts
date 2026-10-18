import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { characterSpecies } from '../../server/db/seeds/data/character_species'
import { applyMigration, replayMigrations } from '../fixtures/migrations'

// Migration 0147 : `extra_damage`, que rien ne lisait, devient `critical_extra_dice` (Attaques sauvages) et
// `weapon_damage_dice` (objets personnalisés). Les deux chemins (seed, migration) doivent produire les mêmes données.

const MIGRATION = '0147_extra_damage_to_dice.sql'

let client: Client
let savageFeatureId: number
const rows: Record<string, number> = {}

const insert = async (sql: string, args: (string | number | null)[] = []) =>
  Number((await client.execute({ sql, args })).lastInsertRowid)

const customEffect = (value: unknown) =>
  insert('INSERT INTO effects (type, value) VALUES (?, ?)', ['extra_damage', JSON.stringify(value)])

const effectRow = async (id: number) => {
  const r = (await client.execute({ sql: 'SELECT type, value FROM effects WHERE id = ?', args: [id] })).rows[0]!
  return { type: String(r.type), value: JSON.parse(String(r.value)) }
}

const count = async (sql: string, args: (string | number)[] = []) =>
  Number((await client.execute({ sql, args })).rows[0]!.c)

beforeAll(async () => {
  client = createClient({ url: ':memory:' })
  await replayMigrations(client, { before: MIGRATION })
  await client.execute('PRAGMA foreign_keys = OFF')

  savageFeatureId = await insert(
    'INSERT INTO features (name, description, feature_type, level_required) VALUES (?, ?, ?, ?)',
    ['Attaques sauvages', 'ancienne description', 'species_trait', 1],
  )
  const oldSavage = await customEffect({ trigger: 'critical_hit', attackType: 'melee', extraDie: 1 })
  await insert('INSERT INTO feature_effects (feature_id, effect_id) VALUES (?, ?)', [savageFeatureId, oldSavage])

  rows.fire = await customEffect({ die_count_notation: '1d6', damage_type: 'fire' })
  rows.cold = await customEffect({ die_count_notation: '12d10', damage_type: 'cold' })
  rows.bonus = await customEffect({ die_count_notation: '2d6+3', damage_type: 'fire' })
  rows.upper = await customEffect({ die_count_notation: '1D6', damage_type: 'fire' })
  rows.zero = await customEffect({ die_count_notation: '0d6', damage_type: 'fire' })
  await insert('INSERT INTO item_effects (item_id, effect_id) VALUES (?, ?)', [1, rows.fire])

  for (let pass = 0; pass < 2; pass++) await applyMigration(client, MIGRATION)
})

describe('migration 0147 — extra_damage', () => {
  it('Attaques sauvages : critical_extra_dice à la place de extra_damage, comme le seed', async () => {
    const res = await client.execute({
      sql: 'SELECT e.type, e.value FROM feature_effects fe JOIN effects e ON e.id = fe.effect_id WHERE fe.feature_id = ?',
      args: [savageFeatureId],
    })
    const effects = res.rows.map(r => ({ type: String(r.type), value: JSON.parse(String(r.value)) }))
    const seeded = characterSpecies.find(s => s.name === 'Demi-orc')!.traits.find(t => t.name === 'Attaques sauvages')!.effects
    expect(effects).toEqual(seeded)
    expect(effects).toEqual([{ type: 'critical_extra_dice', value: { dice: { op: 'fixed', value: 1 } } }])
  })

  it('objets personnalisés : la notation devient des dés fixes, le lien de l\'objet est conservé', async () => {
    expect(await effectRow(rows.fire!)).toEqual({
      type: 'weapon_damage_dice',
      value: { name: 'Dégâts supplémentaires', dice: { op: 'fixed', value: 1 }, sides: 6, damageType: 'fire', weapons: 'all', limit: 'each_hit' },
    })
    expect(await effectRow(rows.cold!)).toMatchObject({ type: 'weapon_damage_dice', value: { dice: { op: 'fixed', value: 12 }, sides: 10, damageType: 'cold' } })
    expect(await count('SELECT count(*) AS c FROM item_effects WHERE effect_id = ?', [rows.fire!])).toBe(1)
  })

  it('une notation qui n\'est pas « NdM » n\'est pas touchée', async () => {
    expect(await effectRow(rows.bonus!)).toEqual({ type: 'extra_damage', value: { die_count_notation: '2d6+3', damage_type: 'fire' } })
    expect(await effectRow(rows.upper!)).toMatchObject({ type: 'extra_damage' })
    expect(await effectRow(rows.zero!)).toMatchObject({ type: 'extra_damage' })
  })

  it('rejouée, ne duplique aucun effet', async () => {
    expect(await count('SELECT count(*) AS c FROM effects WHERE type = ?', ['critical_extra_dice'])).toBe(1)
    expect(await count('SELECT count(*) AS c FROM effects WHERE type = ?', ['weapon_damage_dice'])).toBe(2)
    expect(await count('SELECT count(*) AS c FROM effects WHERE type = ? AND json_extract(value, \'$.trigger\') IS NOT NULL', ['extra_damage'])).toBe(0)
  })
})
