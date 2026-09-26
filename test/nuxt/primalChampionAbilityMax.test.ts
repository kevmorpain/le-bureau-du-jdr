import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as srcSchema from '../../server/db/schema'
import { barbareFeatures } from '../../server/db/seeds/data/barbare'

// Migration 0102 : pose sur les bases déployées le relèvement du maximum de FOR/CON de « Champion
// primitif » (Barbare, niv. 20), que le seed porte pour les bases neuves.

const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations') + '/'
const NUXTHUB_UTILS = pathToFileURL(join(process.cwd(), 'node_modules', '@nuxthub', 'core', 'dist', 'db', 'lib', 'utils.mjs')).href
const MIGRATION = '0102_primal_champion_ability_max.sql'

const seedMaxEffects = (barbareFeatures.find(f => f.name === 'Champion primitif')?.effects ?? [])
  .filter(e => e.type === 'ability_max_increase')

let client: Client
let championFeatureId = 0
let decoyFeatureId = 0

async function linkedMaxEffects(featureId: number): Promise<{ type: string, value: string }[]> {
  const res = await client.execute({
    sql: 'SELECT e.type, e.value FROM feature_effects fe JOIN effects e ON e.id = fe.effect_id WHERE fe.feature_id = ? AND e.type = \'ability_max_increase\'',
    args: [featureId],
  })
  return res.rows.map(r => ({ type: String(r.type), value: String(r.value) }))
}

beforeAll(async () => {
  const mod = await import(/* @vite-ignore */ NUXTHUB_UTILS)
  const splitSqlQueries = mod.splitSqlQueries as (sql: string) => string[]
  const files = (await readdir(MIGRATIONS_DIR)).filter(f => f.endsWith('.sql')).sort()

  client = createClient({ url: ':memory:' })
  await client.execute('PRAGMA foreign_keys = ON')
  for (const file of files) {
    const sql = await readFile(MIGRATIONS_DIR + file, 'utf8')
    for (const statement of splitSqlQueries(sql)) await client.execute(statement)
  }
  await client.execute('PRAGMA foreign_keys = OFF')
  const orm = drizzle(client, { schema: srcSchema, casing: 'snake_case' })

  const barbarian = await orm.insert(srcSchema.classes).values({ name: 'Barbare', hitDice: '1d12' }).returning().get()
  const fighter = await orm.insert(srcSchema.classes).values({ name: 'Guerrier', hitDice: '1d10' }).returning().get()
  const feature = (classId: number) => orm.insert(srcSchema.features)
    .values({ name: 'Champion primitif', featureType: 'class_feature', classId, levelRequired: 20 })
    .returning().get()
  championFeatureId = (await feature(barbarian.id)).id
  decoyFeatureId = (await feature(fighter.id)).id

  const migration = await readFile(MIGRATIONS_DIR + MIGRATION, 'utf8')
  for (let pass = 0; pass < 2; pass++) {
    for (const statement of splitSqlQueries(migration)) await client.execute(statement)
  }
})

describe('migration 0102 — Champion primitif', () => {
  it('lie un relèvement de maximum par caractéristique, même rejouée', async () => {
    expect(await linkedMaxEffects(championFeatureId)).toHaveLength(2)
    const count = await client.execute('SELECT COUNT(*) AS c FROM effects WHERE type = \'ability_max_increase\'')
    expect(Number(count.rows[0]!.c)).toBe(2)
  })

  it('écrit exactement les effets du seed, pour qu\'un reseed réutilise les lignes', async () => {
    const byValue = (a: { value: string }, b: { value: string }) => a.value.localeCompare(b.value)
    expect(seedMaxEffects).toHaveLength(2)
    expect((await linkedMaxEffects(championFeatureId)).sort(byValue)).toEqual(
      seedMaxEffects.map(e => ({ type: e.type, value: JSON.stringify(e.value) })).sort(byValue),
    )
  })

  it('ignore une feature homonyme d\'une autre classe', async () => {
    expect(await linkedMaxEffects(decoyFeatureId)).toEqual([])
  })
})
