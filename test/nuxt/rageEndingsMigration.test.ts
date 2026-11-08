import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { barbareFeatures } from '../../server/db/seeds/data/barbare'
import { applyMigration, replayMigrations } from '../fixtures/migrations'

// Migration 0159 : pose sur la Rage déployée les drapeaux de fin de rage et d'interdiction des sorts, comme le seed les déclare.

const MIGRATION = '0159_rage_endings.sql'

const BARBARIAN = 1
const BARBARIAN_5_5 = 2
const RAGE = 100
const RAGE_5_5 = 101
const OTHER = 102

const seed = barbareFeatures.find(f => f.name === 'Rage')!

let client: Client

const rowOf = async (featureId: number) => {
  const [r] = (await client.execute({ sql: 'SELECT description, meta FROM features WHERE id = ?', args: [featureId] })).rows
  return { description: String(r!.description), meta: r!.meta == null ? null : JSON.parse(String(r!.meta)) }
}

beforeAll(async () => {
  client = createClient({ url: ':memory:' })
  await replayMigrations(client, { before: MIGRATION })
  await client.execute('PRAGMA foreign_keys = OFF')
  await client.execute(`INSERT INTO classes (id, name, hit_dice, ruleset) VALUES (${BARBARIAN}, 'Barbare', '1d12', '5'), (${BARBARIAN_5_5}, 'Barbare', '1d12', '5.5')`)
  await client.execute(`INSERT INTO features (id, name, description, feature_type, class_id, level_required, meta) VALUES
    (${RAGE}, 'Rage', 'ancien texte', 'class_feature', ${BARBARIAN}, 1, '{"resource":"rage"}'),
    (${RAGE_5_5}, 'Rage', 'version 5.5', 'class_feature', ${BARBARIAN_5_5}, 1, '{"resource":"rage"}'),
    (${OTHER}, 'Attaque téméraire', 'ancien texte', 'class_feature', ${BARBARIAN}, 2, '{"endsOnNewTurn":true}')`)
  for (let pass = 0; pass < 2; pass++) await applyMigration(client, MIGRATION)
})

describe('migration 0159 — Rage', () => {
  it('pose le texte et la meta du seed, même rejouée', async () => {
    const row = await rowOf(RAGE)
    expect(row.description).toBe(seed.description)
    expect(row.meta).toEqual(seed.meta)
    expect(row.meta).toMatchObject({ endsWhenUnconscious: true, endsWithoutCombat: true, persistentFromClassLevel: 15, blocksSpellcasting: true })
  })

  it('ignore l\'homonyme 5.5 et les autres capacités', async () => {
    expect(await rowOf(RAGE_5_5)).toEqual({ description: 'version 5.5', meta: { resource: 'rage' } })
    expect(await rowOf(OTHER)).toEqual({ description: 'ancien texte', meta: { endsOnNewTurn: true } })
  })

  it('sur une base vierge, ne crée rien', async () => {
    const blank = createClient({ url: ':memory:' })
    await replayMigrations(blank)
    const res = await blank.execute(`SELECT COUNT(*) AS n FROM features WHERE name = 'Rage'`)
    expect(Number(res.rows[0]!.n)).toBe(0)
  })
})
