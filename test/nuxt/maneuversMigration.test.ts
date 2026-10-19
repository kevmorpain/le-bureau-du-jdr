import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { guerrierSubclasses } from '../../server/db/seeds/data/guerrier'
import { applyMigration, replayMigrations } from '../fixtures/migrations'

// Migration 0151 : pose sur une base déployée les manœuvres, les dés de supériorité et le choix d'outil de Disciple martial,
// comme le seed les déclare.

const MIGRATION = '0151_maneuvers_superiority_dice.sql'

const FIGHTER = 1
const FIGHTER_5_5 = 2
const BATTLE_MASTER = 10
const BATTLE_MASTER_5_5 = 11
const CHAMPION = 12
const SUPERIORITY = 100
const DISCIPLE = 101
const SUPERIORITY_5_5 = 110

const seed = guerrierSubclasses.find(s => s.name === 'Maître de guerre')!
const seeded = (name: string) => seed.features.find(f => f.name === name)!

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
  await client.execute(`INSERT INTO classes (id, name, hit_dice, ruleset) VALUES (${FIGHTER}, 'Guerrier', '1d10', '5'), (${FIGHTER_5_5}, 'Guerrier', '1d10', '5.5')`)
  await client.execute(`INSERT INTO subclasses (id, class_id, name) VALUES
    (${BATTLE_MASTER}, ${FIGHTER}, 'Maître de guerre'), (${BATTLE_MASTER_5_5}, ${FIGHTER_5_5}, 'Maître de guerre'), (${CHAMPION}, ${FIGHTER}, 'Champion')`)
  await client.execute(`INSERT INTO features (id, name, description, feature_type, subclass_id, level_required, recharge_type) VALUES
    (${SUPERIORITY}, 'Supériorité martiale', 'ancien texte', 'subclass_feature', ${BATTLE_MASTER}, 3, 'short_rest'),
    (${DISCIPLE}, 'Disciple martial', 'ancien texte', 'subclass_feature', ${BATTLE_MASTER}, 3, NULL),
    (${SUPERIORITY_5_5}, 'Supériorité martiale', 'ancien texte', 'subclass_feature', ${BATTLE_MASTER_5_5}, 3, 'short_rest')`)
  for (let pass = 0; pass < 2; pass++) await applyMigration(client, MIGRATION)
})

describe('migration 0151 — Maître de guerre', () => {
  it('pose les seize manœuvres une seule fois, exactement comme le seed, même rejouée', async () => {
    const res = await client.execute({ sql: `SELECT name, description, feature_type, level_required, action_type, tag, meta FROM features WHERE subclass_id = ? AND tag = 'maneuver'`, args: [BATTLE_MASTER] })
    const byName = (a: { name: unknown }, b: { name: unknown }) => String(a.name).localeCompare(String(b.name), 'fr')
    const expected = seed.features.filter(f => f.tag === 'maneuver').sort(byName)
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

  it('« Supériorité martiale » reçoit son texte, son compteur de dés, son DD et son dé', async () => {
    const def = seeded('Supériorité martiale')
    const [row] = (await client.execute({ sql: 'SELECT description, max_uses_formula, meta FROM features WHERE id = ?', args: [SUPERIORITY] })).rows
    expect(row!.description).toBe(def.description)
    expect(JSON.parse(String(row!.max_uses_formula))).toEqual(def.maxUsesFormula)
    expect(JSON.parse(String(row!.meta))).toEqual(def.meta)

    const effects = await client.execute({ sql: 'SELECT e.type, e.value FROM feature_effects fe JOIN effects e ON e.id = fe.effect_id WHERE fe.feature_id = ?', args: [SUPERIORITY] })
    expect(effects.rows.map(r => ({ type: r.type, value: JSON.parse(String(r.value)) }))).toEqual(def.effects)
  })

  it('pose le point de choix des manœuvres et celui de l\'outil, comme le seed', async () => {
    const expected = (name: string) => {
      const p = seeded(name).progression!
      return [{ kind: p.kind, count: p.count, optionSource: p.optionSource, replaceable: p.replaceable ?? false }]
    }
    expect(await progressionsOf(SUPERIORITY)).toEqual(expected('Supériorité martiale'))
    expect(await progressionsOf(DISCIPLE)).toEqual(expected('Disciple martial'))
  })

  it('ignore l\'homonyme 5.5 et les autres sous-classes', async () => {
    const other = await client.execute({ sql: `SELECT COUNT(*) AS n FROM features WHERE subclass_id IN (?, ?) AND tag = 'maneuver'`, args: [BATTLE_MASTER_5_5, CHAMPION] })
    expect(Number(other.rows[0]!.n)).toBe(0)
    const [row] = (await client.execute({ sql: 'SELECT description FROM features WHERE id = ?', args: [SUPERIORITY_5_5] })).rows
    expect(row!.description).toBe('ancien texte')
    expect(await progressionsOf(SUPERIORITY_5_5)).toEqual([])
  })

  it('sur une base vierge, ne crée rien', async () => {
    const blank = createClient({ url: ':memory:' })
    await replayMigrations(blank)
    const res = await blank.execute(`SELECT COUNT(*) AS n FROM features WHERE tag = 'maneuver'`)
    expect(Number(res.rows[0]!.n)).toBe(0)
  })
})
