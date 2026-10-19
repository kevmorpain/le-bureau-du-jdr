import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { rodeurFeatures } from '../../server/db/seeds/data/rodeur'
import { applyMigration, replayMigrations } from '../fixtures/migrations'

// Migration 0149 : pose sur une base déployée les points de choix du Rôdeur, comme le seed les déclare.

const MIGRATION = '0149_ranger_favorite_choices.sql'

const RANGER = 1
const RANGER_5_5 = 2
const FIGHTER = 3

let client: Client

const progressionOf = async (featureId: number) => {
  const res = await client.execute({ sql: 'SELECT kind, count, option_source, replaceable FROM progression WHERE feature_id = ?', args: [featureId] })
  return res.rows.map(r => ({
    kind: r.kind,
    count: JSON.parse(String(r.count)),
    optionSource: JSON.parse(String(r.option_source)),
    replaceable: Boolean(r.replaceable),
  }))
}

beforeAll(async () => {
  client = createClient({ url: ':memory:' })
  await replayMigrations(client, { before: MIGRATION })
  await client.execute('PRAGMA foreign_keys = OFF')
  await client.execute(`INSERT INTO classes (id, name, hit_dice, ruleset) VALUES
    (${RANGER}, 'Rôdeur', '1d10', '5'), (${RANGER_5_5}, 'Rôdeur', '1d10', '5.5'), (${FIGHTER}, 'Guerrier', '1d10', '5')`)
  await client.execute(`INSERT INTO features (id, name, feature_type, class_id, level_required) VALUES
    (100, 'Ennemi juré', 'class_feature', ${RANGER}, 1),
    (101, 'Explorateur-né', 'class_feature', ${RANGER}, 1),
    (110, 'Ennemi juré', 'class_feature', ${RANGER_5_5}, 1),
    (120, 'Ennemi juré', 'class_feature', ${FIGHTER}, 1)`)
  for (let pass = 0; pass < 2; pass++) await applyMigration(client, MIGRATION)
})

describe('migration 0149 — Rôdeur', () => {
  it('pose chaque point de choix une seule fois, exactement comme le seed, même rejouée', async () => {
    const seeded = (name: string) => {
      const p = rodeurFeatures.find(f => f.name === name)!.progression!
      return [{ kind: p.kind, count: p.count, optionSource: p.optionSource, replaceable: false }]
    }
    expect(await progressionOf(100)).toEqual(seeded('Ennemi juré'))
    expect(await progressionOf(101)).toEqual(seeded('Explorateur-né'))
  })

  it('ignore l\'homonyme 5.5 et les autres classes', async () => {
    expect(await progressionOf(110)).toEqual([])
    expect(await progressionOf(120)).toEqual([])
  })

  it('sur une base vierge, ne crée rien', async () => {
    const blank = createClient({ url: ':memory:' })
    await replayMigrations(blank)
    const res = await blank.execute(`SELECT COUNT(*) AS n FROM progression WHERE kind = 'favored_enemy'`)
    expect(Number(res.rows[0]!.n)).toBe(0)
  })
})
