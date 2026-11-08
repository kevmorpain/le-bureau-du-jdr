import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { boonsData } from '../../server/db/seeds/data/boons'
import { applyMigration, replayMigrations } from '../fixtures/migrations'

// Migration 0160 : pose sur une base déployée les six faveurs permanentes (manuels et tomes) et leurs effets, comme le seed.

const MIGRATION = '0160_permanent_boons.sql'

let client: Client

beforeAll(async () => {
  client = createClient({ url: ':memory:' })
  await replayMigrations(client, { before: MIGRATION })
  // Une base déployée a déjà son catalogue de dons.
  await client.execute(`INSERT INTO features (name, description, feature_type) VALUES ('Vigilant', 'desc', 'feat')`)
  for (let pass = 0; pass < 2; pass++) await applyMigration(client, MIGRATION)
})

describe('migration 0160 — faveurs permanentes', () => {
  it('pose les six faveurs une seule fois, exactement comme le seed, même rejouée', async () => {
    const res = await client.execute(`SELECT name, description, feature_type, ruleset, source FROM features WHERE feature_type = 'boon'`)
    const byName = (a: { name: unknown }, b: { name: unknown }) => String(a.name).localeCompare(String(b.name), 'fr')
    expect(res.rows).toHaveLength(6)
    expect(res.rows.map(r => ({ name: r.name, description: r.description, featureType: r.feature_type, ruleset: r.ruleset, source: r.source })).sort(byName))
      .toEqual(boonsData.map(b => ({ name: b.name, description: b.description, featureType: 'boon', ruleset: '5', source: 'core' })).sort(byName))
  })

  it('relie à chacune ses deux effets, ceux du seed', async () => {
    for (const boon of boonsData) {
      const res = await client.execute({
        sql: `SELECT e.type, e.value FROM features f JOIN feature_effects fe ON fe.feature_id = f.id JOIN effects e ON e.id = fe.effect_id WHERE f.name = ? AND f.feature_type = 'boon'`,
        args: [boon.name],
      })
      const sortKey = (e: { type: string, value: unknown }) => `${e.type}:${JSON.stringify(e.value)}`
      expect(res.rows.map(r => ({ type: String(r.type), value: JSON.parse(String(r.value)) })).map(sortKey).sort(), boon.name)
        .toEqual(boon.effects.map(sortKey).sort())
    }
  })

  it('une même valeur d\'effet n\'est créée qu\'une fois', async () => {
    const res = await client.execute(`SELECT count(*) AS c FROM effects WHERE type = 'ability_max_increase' AND value = '{"ability":"con","amount":2}'`)
    expect(Number(res.rows[0]!.c)).toBe(1)
  })

  it('laisse les dons à leur place', async () => {
    const res = await client.execute(`SELECT name FROM features WHERE feature_type = 'feat'`)
    expect(res.rows.map(r => r.name)).toEqual(['Vigilant'])
  })

  it('sur une base vierge, ne crée rien', async () => {
    const blank = createClient({ url: ':memory:' })
    await replayMigrations(blank)
    const res = await blank.execute(`SELECT (SELECT count(*) FROM features WHERE feature_type = 'boon') AS boons, (SELECT count(*) FROM effects) AS effects`)
    expect({ boons: Number(res.rows[0]!.boons), effects: Number(res.rows[0]!.effects) }).toEqual({ boons: 0, effects: 0 })
  })
})
