import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { alwaysPreparedEffects, CLERIC_DOMAIN_SPELLS, PALADIN_OATH_SPELLS, type AlwaysPreparedTable } from '../../server/db/seeds/data/alwaysPreparedSpells'
import { clercSubclasses } from '../../server/db/seeds/data/clerc'
import { paladinSubclasses } from '../../server/db/seeds/data/paladin'
import { applyMigration, replayMigrations } from '../fixtures/migrations'

// Migration 0114 : pose sur les features de domaine et de serment déployées les sorts toujours préparés que
// le seed déclare (`alwaysPreparedEffects`). Les deux chemins doivent produire les mêmes effets.

const MIGRATION = '0114_always_prepared_spells.sql'

const CLERIC = 1
const PALADIN = 2
const CLERIC_5_5 = 3

// sous-classe → feature qui porte ses sorts (source : les seeds clerc.ts et paladin.ts)
const CARRIERS = [
  ...clercSubclasses.map(s => ({
    className: 'Clerc',
    classId: CLERIC,
    subclass: s.name,
    feature: s.features.find(f => f.name.startsWith('Sorts de domaine'))!.name,
    table: CLERIC_DOMAIN_SPELLS[s.name]!,
  })),
  ...paladinSubclasses.map(s => ({
    className: 'Paladin',
    classId: PALADIN,
    subclass: s.name,
    feature: s.features.find(f => f.name.startsWith('Sorts du serment'))!.name,
    table: PALADIN_OATH_SPELLS[s.name]!,
  })),
].filter(c => c.table) satisfies Array<{ className: string, classId: number, subclass: string, feature: string, table: AlwaysPreparedTable }>

let client: Client
const featureIds = new Map<string, number>()
let homonymFeatureId = 0

const effectsOf = async (featureId: number) => {
  const res = await client.execute({
    sql: 'SELECT e.type, e.value FROM feature_effects fe JOIN effects e ON e.id = fe.effect_id WHERE fe.feature_id = ?',
    args: [featureId],
  })
  return res.rows.map(r => ({ type: String(r.type), value: JSON.parse(String(r.value)) }))
}
const byKey = (e: { value: { spellName: string, unlockLevel: number } }) => `${e.value.unlockLevel}:${e.value.spellName}`

beforeAll(async () => {
  client = createClient({ url: ':memory:' })
  await replayMigrations(client, { before: MIGRATION })
  await client.execute('PRAGMA foreign_keys = OFF')
  await client.execute(`INSERT INTO classes (id, name, hit_dice) VALUES (${CLERIC}, 'Clerc', '1d8'), (${PALADIN}, 'Paladin', '1d10')`)
  await client.execute(`INSERT INTO classes (id, name, hit_dice, ruleset) VALUES (${CLERIC_5_5}, 'Clerc', '1d8', '5.5')`)

  let subclassId = 100
  let featureId = 1000
  for (const c of CARRIERS) {
    await client.execute({ sql: 'INSERT INTO subclasses (id, class_id, name) VALUES (?, ?, ?)', args: [subclassId, c.classId, c.subclass] })
    await client.execute({ sql: 'INSERT INTO features (id, name, feature_type, subclass_id) VALUES (?, ?, ?, ?)', args: [featureId, c.feature, 'subclass_feature', subclassId] })
    featureIds.set(c.subclass, featureId)
    subclassId++
    featureId++
  }
  const first = CARRIERS[0]!
  await client.execute({ sql: 'INSERT INTO subclasses (id, class_id, name) VALUES (?, ?, ?)', args: [subclassId, CLERIC_5_5, first.subclass] })
  await client.execute({ sql: 'INSERT INTO features (id, name, feature_type, subclass_id) VALUES (?, ?, ?, ?)', args: [featureId, first.feature, 'subclass_feature', subclassId] })
  homonymFeatureId = featureId

  for (let pass = 0; pass < 2; pass++) await applyMigration(client, MIGRATION)
})

describe('migration 0114 — sorts toujours préparés', () => {
  it('couvre les sept domaines du Clerc et les trois serments du Paladin', () => {
    expect(CARRIERS.filter(c => c.className === 'Clerc')).toHaveLength(7)
    expect(CARRIERS.filter(c => c.className === 'Paladin')).toHaveLength(3)
  })

  for (const c of CARRIERS) {
    it(`${c.subclass} : exactement les effets du seed, même rejouée`, async () => {
      const expected = alwaysPreparedEffects(c.table).map(e => ({ type: e.type, value: e.value })).sort((a, b) => byKey(a as never).localeCompare(byKey(b as never)))
      const actual = (await effectsOf(featureIds.get(c.subclass)!)).sort((a, b) => byKey(a).localeCompare(byKey(b)))
      expect(actual).toEqual(expected)
      expect(actual).toHaveLength(Object.keys(c.table).length * 2)
    })
  }

  it('écrit le JSON exactement comme le seed : relancer le seed ne duplique aucun effet', async () => {
    for (const c of CARRIERS) {
      const raw = await client.execute({
        sql: 'SELECT e.value FROM feature_effects fe JOIN effects e ON e.id = fe.effect_id WHERE fe.feature_id = ?',
        args: [featureIds.get(c.subclass)!],
      })
      const expectedRaw = alwaysPreparedEffects(c.table).map(e => JSON.stringify(e.value)).sort()
      expect(raw.rows.map(r => String(r.value)).sort(), c.subclass).toEqual(expectedRaw)
    }
  })

  it('ignore l\'homonyme 5.5', async () => {
    expect(await effectsOf(homonymFeatureId)).toEqual([])
  })

  it('sur une base vierge, aucun effet orphelin n\'est créé', async () => {
    const blank = createClient({ url: ':memory:' })
    await replayMigrations(blank)
    const res = await blank.execute('SELECT COUNT(*) AS n FROM effects')
    expect(Number(res.rows[0]!.n)).toBe(0)
  })
})

describe('seed — effets toujours préparés', () => {
  it('chaque feature de domaine ou de serment porte les effets de sa table', () => {
    for (const s of [...clercSubclasses, ...paladinSubclasses]) {
      const table = CLERIC_DOMAIN_SPELLS[s.name] ?? PALADIN_OATH_SPELLS[s.name]
      if (!table) continue
      const carrier = s.features.find(f => f.name.startsWith('Sorts de domaine') || f.name.startsWith('Sorts du serment'))!
      expect(carrier.effects, s.name).toEqual(alwaysPreparedEffects(table))
    }
  })

  it('chaque sous-classe de Clerc et chaque serment seedé a sa table', () => {
    for (const s of clercSubclasses) expect(CLERIC_DOMAIN_SPELLS[s.name], s.name).toBeDefined()
    for (const s of paladinSubclasses) expect(PALADIN_OATH_SPELLS[s.name], s.name).toBeDefined()
  })
})
