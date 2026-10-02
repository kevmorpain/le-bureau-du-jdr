import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import {
  CIRCLE_CARRIER_NAME,
  CIRCLE_SPELLS_FEATURE_NAME,
  circleSpellEffects,
  circleSpellsDescription,
  DRUID_TERRAINS,
} from '../../server/db/seeds/data/alwaysPreparedSpells'
import { druideSubclasses } from '../../server/db/seeds/data/druide'
import { applyMigration, replayMigrations } from '../fixtures/migrations'

// Migration 0115 : pose sur une base déployée le choix de terrain du Cercle de la terre et les sorts de cercle
// conditionnés par ce terrain, comme le seed les déclare.

const MIGRATION = '0115_druid_circle_spells.sql'

const DRUID = 1
const DRUID_5_5 = 2
const EARTH = 10
const EARTH_5_5 = 11
const MOON = 12

let client: Client

const featureOf = async (subclassId: number, name: string) => {
  const res = await client.execute({ sql: 'SELECT id, description, feature_type, level_required FROM features WHERE subclass_id = ? AND name = ?', args: [subclassId, name] })
  return res.rows
}
const effectsOf = async (featureId: number) => {
  const res = await client.execute({
    sql: 'SELECT e.value FROM feature_effects fe JOIN effects e ON e.id = fe.effect_id WHERE fe.feature_id = ?',
    args: [featureId],
  })
  return res.rows.map(r => JSON.parse(String(r.value)) as { spellName: string, unlockLevel: number, terrain: string })
}
const key = (e: { spellName: string, unlockLevel: number, terrain?: string }) => `${e.terrain}|${e.unlockLevel}|${e.spellName}`

beforeAll(async () => {
  client = createClient({ url: ':memory:' })
  await replayMigrations(client, { before: MIGRATION })
  await client.execute('PRAGMA foreign_keys = OFF')
  await client.execute(`INSERT INTO classes (id, name, hit_dice) VALUES (${DRUID}, 'Druide', '1d8')`)
  await client.execute(`INSERT INTO classes (id, name, hit_dice, ruleset) VALUES (${DRUID_5_5}, 'Druide', '1d8', '5.5')`)
  await client.execute(`INSERT INTO subclasses (id, class_id, name) VALUES
    (${EARTH}, ${DRUID}, 'Cercle de la terre'), (${EARTH_5_5}, ${DRUID_5_5}, 'Cercle de la terre'), (${MOON}, ${DRUID}, 'Cercle de la lune')`)
  await client.execute(`INSERT INTO features (id, name, description, feature_type, subclass_id, level_required) VALUES
    (100, '${CIRCLE_SPELLS_FEATURE_NAME}', 'ancien texte', 'subclass_feature', ${EARTH}, 3),
    (101, '${CIRCLE_SPELLS_FEATURE_NAME}', 'ancien texte', 'subclass_feature', ${EARTH_5_5}, 3)`)
  for (let pass = 0; pass < 2; pass++) await applyMigration(client, MIGRATION)
})

describe('migration 0115 — Cercle de la terre', () => {
  it('pose le choix de terrain une seule fois, porteur invisible au niveau 2, avec les huit terrains', async () => {
    const carriers = await featureOf(EARTH, CIRCLE_CARRIER_NAME)
    expect(carriers).toHaveLength(1)
    expect(carriers[0]).toMatchObject({ feature_type: 'choice_carrier', level_required: 2 })

    const prog = await client.execute({ sql: 'SELECT kind, count, option_source, replaceable FROM progression WHERE feature_id = ?', args: [Number(carriers[0]!.id)] })
    expect(prog.rows).toHaveLength(1)
    expect(prog.rows[0]!.kind).toBe('terrain')
    expect(JSON.parse(String(prog.rows[0]!.count))).toEqual({ op: 'fixed', value: 1 })
    expect(JSON.parse(String(prog.rows[0]!.option_source))).toEqual({ type: 'enum', values: [...DRUID_TERRAINS] })
  })

  it('conditionne chaque sort de cercle par son terrain : exactement les effets du seed, même rejouée', async () => {
    const expected = circleSpellEffects().map(e => e.value as { spellName: string, unlockLevel: number, terrain: string }).sort((a, b) => key(a).localeCompare(key(b)))
    const actual = (await effectsOf(100)).sort((a, b) => key(a).localeCompare(key(b)))
    expect(actual).toEqual(expected)
    expect(actual).toHaveLength(DRUID_TERRAINS.length * 8)
  })

  it('écrit le JSON exactement comme le seed : relancer le seed ne duplique aucun effet', async () => {
    const raw = await client.execute({
      sql: 'SELECT e.value FROM feature_effects fe JOIN effects e ON e.id = fe.effect_id WHERE fe.feature_id = 100',
      args: [],
    })
    expect(raw.rows.map(r => String(r.value)).sort()).toEqual(circleSpellEffects().map(e => JSON.stringify(e.value)).sort())
  })

  it('corrige la description de « Sorts de cercle »', async () => {
    const [feature] = await featureOf(EARTH, CIRCLE_SPELLS_FEATURE_NAME)
    expect(feature!.description).toBe(circleSpellsDescription())
  })

  it('ignore l\'homonyme 5.5 et les autres cercles', async () => {
    expect(await featureOf(EARTH_5_5, CIRCLE_CARRIER_NAME)).toHaveLength(0)
    expect(await effectsOf(101)).toEqual([])
    expect((await featureOf(EARTH_5_5, CIRCLE_SPELLS_FEATURE_NAME))[0]!.description).toBe('ancien texte')
    expect(await featureOf(MOON, CIRCLE_CARRIER_NAME)).toHaveLength(0)
  })

  it('sur une base vierge, ne crée ni porteur ni effet', async () => {
    const blank = createClient({ url: ':memory:' })
    await replayMigrations(blank)
    const feats = await blank.execute(`SELECT COUNT(*) AS n FROM features WHERE name = '${CIRCLE_CARRIER_NAME}'`)
    const effects = await blank.execute('SELECT COUNT(*) AS n FROM effects')
    expect(Number(feats.rows[0]!.n)).toBe(0)
    expect(Number(effects.rows[0]!.n)).toBe(0)
  })
})

describe('seed — Cercle de la terre', () => {
  const earth = druideSubclasses.find(s => s.name === 'Cercle de la terre')!

  it('« Sorts de cercle » porte les effets conditionnés et la description du seed', () => {
    const feature = earth.features.find(f => f.name === CIRCLE_SPELLS_FEATURE_NAME)!
    expect(feature.effects).toEqual(circleSpellEffects())
    expect(feature.description).toBe(circleSpellsDescription())
  })

  it('le porteur de terrain déclare un choix `terrain` à huit valeurs, au niveau 2', () => {
    const carrier = earth.features.find(f => f.name === CIRCLE_CARRIER_NAME)!
    expect(carrier).toMatchObject({ featureType: 'choice_carrier', levelRequired: 2 })
    expect(carrier.progression).toEqual({ kind: 'terrain', count: { op: 'fixed', value: 1 }, optionSource: { type: 'enum', values: [...DRUID_TERRAINS] } })
  })
})
