import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { moineSubclasses } from '../../server/db/seeds/data/moine'
import { applyMigration, replayMigrations } from '../fixtures/migrations'

// Migration 0158 : pose sur une base déployée les seize disciplines élémentaires, leur point de choix et le texte de
// « Disciple des éléments », comme le seed les déclare.

const MIGRATION = '0158_elemental_disciplines.sql'

const MONK = 1
const MONK_5_5 = 2
const FOUR_ELEMENTS = 10
const FOUR_ELEMENTS_5_5 = 11
const OPEN_HAND = 12
const DISCIPLE = 100
const DISCIPLE_5_5 = 110

const seed = moineSubclasses.find(s => s.name === 'Voie des quatre éléments')!
const disciple = seed.features.find(f => f.name === 'Disciple des éléments')!

let client: Client

const progressionsOf = async (featureId: number) => {
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
  await client.execute(`INSERT INTO classes (id, name, hit_dice, ruleset) VALUES (${MONK}, 'Moine', '1d8', '5'), (${MONK_5_5}, 'Moine', '1d8', '5.5')`)
  await client.execute(`INSERT INTO subclasses (id, class_id, name) VALUES
    (${FOUR_ELEMENTS}, ${MONK}, 'Voie des quatre éléments'), (${FOUR_ELEMENTS_5_5}, ${MONK_5_5}, 'Voie des quatre éléments'), (${OPEN_HAND}, ${MONK}, 'Voie de la paume')`)
  await client.execute(`INSERT INTO features (id, name, description, feature_type, subclass_id, level_required, action_type) VALUES
    (${DISCIPLE}, 'Disciple des éléments', 'ancien texte', 'subclass_feature', ${FOUR_ELEMENTS}, 3, 'action'),
    (${DISCIPLE_5_5}, 'Disciple des éléments', 'ancien texte', 'subclass_feature', ${FOUR_ELEMENTS_5_5}, 3, 'action')`)
  for (let pass = 0; pass < 2; pass++) await applyMigration(client, MIGRATION)
})

describe('migration 0158 — disciplines élémentaires', () => {
  it('pose les seize disciplines une seule fois, exactement comme le seed, même rejouée', async () => {
    const res = await client.execute({ sql: `SELECT name, description, feature_type, level_required, action_type, tag, meta FROM features WHERE subclass_id = ? AND tag = 'elemental_discipline'`, args: [FOUR_ELEMENTS] })
    const byName = (a: { name: unknown }, b: { name: unknown }) => String(a.name).localeCompare(String(b.name), 'fr')
    const expected = seed.features.filter(f => f.tag === 'elemental_discipline').sort(byName)
    expect(res.rows).toHaveLength(16)
    expect(res.rows.map(r => ({
      name: r.name,
      description: r.description,
      featureType: r.feature_type,
      levelRequired: Number(r.level_required),
      actionType: r.action_type,
      meta: JSON.parse(String(r.meta)),
    })).sort(byName)).toEqual(expected.map(f => ({
      name: f.name,
      description: f.description,
      featureType: f.featureType,
      levelRequired: f.levelRequired,
      actionType: f.actionType ?? null,
      meta: f.meta,
    })))
  })

  it('« Disciple des éléments » reçoit son texte, sans action propre, et son point de choix', async () => {
    const [row] = (await client.execute({ sql: 'SELECT description, action_type FROM features WHERE id = ?', args: [DISCIPLE] })).rows
    expect(row!.description).toBe(disciple.description)
    expect(row!.action_type).toBeNull()

    const p = disciple.progression!
    expect(await progressionsOf(DISCIPLE)).toEqual([{ kind: p.kind, count: p.count, optionSource: p.optionSource, replaceable: p.replaceable ?? false }])
  })

  it('ignore l\'homonyme 5.5 et les autres sous-classes', async () => {
    const other = await client.execute({ sql: `SELECT COUNT(*) AS n FROM features WHERE subclass_id IN (?, ?) AND tag = 'elemental_discipline'`, args: [FOUR_ELEMENTS_5_5, OPEN_HAND] })
    expect(Number(other.rows[0]!.n)).toBe(0)
    const [row] = (await client.execute({ sql: 'SELECT description, action_type FROM features WHERE id = ?', args: [DISCIPLE_5_5] })).rows
    expect(row!.description).toBe('ancien texte')
    expect(row!.action_type).toBe('action')
    expect(await progressionsOf(DISCIPLE_5_5)).toEqual([])
  })

  it('sur une base vierge, ne crée rien', async () => {
    const blank = createClient({ url: ':memory:' })
    await replayMigrations(blank)
    const res = await blank.execute(`SELECT COUNT(*) AS n FROM features WHERE tag = 'elemental_discipline'`)
    expect(Number(res.rows[0]!.n)).toBe(0)
  })
})
