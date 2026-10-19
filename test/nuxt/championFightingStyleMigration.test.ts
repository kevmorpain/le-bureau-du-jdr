import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { guerrierSubclasses } from '../../server/db/seeds/data/guerrier'
import { applyMigration, replayMigrations } from '../fixtures/migrations'

// Migration 0150 : pose sur une base déployée le point de choix du 2ᵉ style de combat du Champion, comme le seed le déclare.

const MIGRATION = '0150_champion_additional_fighting_style.sql'

const FIGHTER = 1
const FIGHTER_5_5 = 2
const CHAMPION = 10
const CHAMPION_5_5 = 11
const MASTER = 12

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
  await client.execute(`INSERT INTO classes (id, name, hit_dice, ruleset) VALUES (${FIGHTER}, 'Guerrier', '1d10', '5'), (${FIGHTER_5_5}, 'Guerrier', '1d10', '5.5')`)
  await client.execute(`INSERT INTO subclasses (id, class_id, name) VALUES
    (${CHAMPION}, ${FIGHTER}, 'Champion'), (${CHAMPION_5_5}, ${FIGHTER_5_5}, 'Champion'), (${MASTER}, ${FIGHTER}, 'Maître de guerre')`)
  await client.execute(`INSERT INTO features (id, name, feature_type, subclass_id, level_required) VALUES
    (100, 'Style de combat supplémentaire', 'subclass_feature', ${CHAMPION}, 10),
    (110, 'Style de combat supplémentaire', 'subclass_feature', ${CHAMPION_5_5}, 10),
    (120, 'Style de combat supplémentaire', 'subclass_feature', ${MASTER}, 10)`)
  for (let pass = 0; pass < 2; pass++) await applyMigration(client, MIGRATION)
})

describe('migration 0150 — Champion', () => {
  it('pose le point de choix une seule fois, exactement comme le seed, même rejouée', async () => {
    const champion = guerrierSubclasses.find(s => s.name === 'Champion')!
    const p = champion.features.find(f => f.name === 'Style de combat supplémentaire')!.progression!
    expect(await progressionOf(100)).toEqual([{ kind: p.kind, count: p.count, optionSource: p.optionSource, replaceable: false }])
  })

  it('ignore l\'homonyme 5.5 et les autres sous-classes', async () => {
    expect(await progressionOf(110)).toEqual([])
    expect(await progressionOf(120)).toEqual([])
  })

  it('sur une base vierge, ne crée rien', async () => {
    const blank = createClient({ url: ':memory:' })
    await replayMigrations(blank)
    const res = await blank.execute(`SELECT COUNT(*) AS n FROM progression WHERE kind = 'additional_fighting_style'`)
    expect(Number(res.rows[0]!.n)).toBe(0)
  })
})
