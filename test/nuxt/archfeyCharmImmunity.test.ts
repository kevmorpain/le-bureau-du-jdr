import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as srcSchema from '../../server/db/schema'
import { warlockSubclasses } from '../../server/db/seeds/data/warlock'
import { applyMigration, replayMigrations } from '../fixtures/migrations'

// Migration 0101 : pose sur les bases déployées l'immunité à l'état charmé de « Défenses captivantes »
// (Archifée, niv. 10), que le seed porte pour les bases neuves. L'affichage est couvert par defenseImmunities.

const MIGRATION = '0101_archfey_charm_immunity.sql'

const seedEffects = warlockSubclasses
  .find(s => s.name === 'L\'Archifée')
  ?.features.find(f => f.name === 'Défenses captivantes')
  ?.effects ?? []

let client: Client
let archfeyFeatureId = 0
let decoyFeatureId = 0

async function linkedEffects(featureId: number): Promise<{ type: string, value: string }[]> {
  const res = await client.execute({
    sql: 'SELECT e.type, e.value FROM feature_effects fe JOIN effects e ON e.id = fe.effect_id WHERE fe.feature_id = ?',
    args: [featureId],
  })
  return res.rows.map(r => ({ type: String(r.type), value: String(r.value) }))
}

beforeAll(async () => {
  client = createClient({ url: ':memory:' })
  await client.execute('PRAGMA foreign_keys = ON')
  await replayMigrations(client)
  await client.execute('PRAGMA foreign_keys = OFF')
  const orm = drizzle(client, { schema: srcSchema, casing: 'snake_case' })

  const warlock = await orm.insert(srcSchema.classes).values({ name: 'Occultiste', hitDice: '1d8' }).returning().get()
  const archfey = await orm.insert(srcSchema.subclasses).values({ classId: warlock.id, name: 'L\'Archifée' }).returning().get()
  const fiend = await orm.insert(srcSchema.subclasses).values({ classId: warlock.id, name: 'Le Fiélon' }).returning().get()
  const feature = (subclassId: number) => orm.insert(srcSchema.features)
    .values({ name: 'Défenses captivantes', featureType: 'subclass_feature', subclassId, levelRequired: 10 })
    .returning().get()
  archfeyFeatureId = (await feature(archfey.id)).id
  decoyFeatureId = (await feature(fiend.id)).id

  for (let pass = 0; pass < 2; pass++) await applyMigration(client, MIGRATION)
})

describe('migration 0101 — Défenses captivantes', () => {
  it('lie un seul effet à la feature de l\'Archifée, même rejouée', async () => {
    expect(await linkedEffects(archfeyFeatureId)).toHaveLength(1)
    const count = await client.execute('SELECT COUNT(*) AS c FROM effects WHERE type = \'condition_immunity\'')
    expect(Number(count.rows[0]!.c)).toBe(1)
  })

  it('écrit exactement l\'effet du seed, pour qu\'un reseed réutilise la ligne', async () => {
    expect(await linkedEffects(archfeyFeatureId)).toEqual(
      seedEffects.map(e => ({ type: e.type, value: JSON.stringify(e.value) })),
    )
  })

  it('ignore une feature homonyme d\'une autre sous-classe', async () => {
    expect(await linkedEffects(decoyFeatureId)).toEqual([])
  })
})
