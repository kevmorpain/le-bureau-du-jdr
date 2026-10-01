import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as srcSchema from '../../server/db/schema'
import { backgroundsData } from '../../server/db/seeds/data/backgrounds'
import { BACKGROUND_PROFICIENCY_CARRIER_NAME } from '../../server/db/seeds/lib/seedBackgroundProficiencies'
import { backgroundChoices } from '../../shared/rules/backgroundProficiencies'
import type { FeatureChoice } from '../../shared/rules/choices'

// Migration 0108 : sur une base déployée, chaque historique prédéfini reçoit sur son porteur les points de
// choix que le seed déclare (`backgroundChoices`).

const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations') + '/'
const NUXTHUB_UTILS = pathToFileURL(join(process.cwd(), 'node_modules', '@nuxthub', 'core', 'dist', 'db', 'lib', 'utils.mjs')).href
const MIGRATION = '0108_background_choices.sql'

let client: Client
const carrierIdByBackground = new Map<string, number>()
let homonymCarrierId = 0
let customCarrierId = 0

async function progressionsOf(featureId: number): Promise<FeatureChoice[]> {
  const res = await client.execute({ sql: 'SELECT kind, count, option_source FROM progression WHERE feature_id = ? ORDER BY kind DESC', args: [featureId] })
  return res.rows.map(r => ({
    kind: String(r.kind),
    count: JSON.parse(String(r.count)).value,
    optionSource: JSON.parse(String(r.option_source)),
  }) as FeatureChoice)
}

beforeAll(async () => {
  const mod = await import(/* @vite-ignore */ NUXTHUB_UTILS)
  const splitSqlQueries = mod.splitSqlQueries as (sql: string) => string[]
  client = createClient({ url: ':memory:' })
  for (const file of (await readdir(MIGRATIONS_DIR)).filter(f => f.endsWith('.sql')).sort()) {
    for (const statement of splitSqlQueries(await readFile(MIGRATIONS_DIR + file, 'utf8'))) await client.execute(statement)
  }
  const orm = drizzle(client, { schema: srcSchema, casing: 'snake_case' })

  const withCarrier = async (values: typeof srcSchema.backgrounds.$inferInsert) => {
    const bg = await orm.insert(srcSchema.backgrounds).values(values).returning().get()
    const carrier = await orm.insert(srcSchema.features)
      .values({ name: BACKGROUND_PROFICIENCY_CARRIER_NAME, featureType: 'proficiency_grant', levelRequired: 1 })
      .returning().get()
    await orm.insert(srcSchema.backgroundFeatures).values({ backgroundId: bg.id, featureId: carrier.id })
    return carrier.id
  }
  for (const bg of backgroundsData) carrierIdByBackground.set(bg.name, await withCarrier({ name: bg.name }))
  homonymCarrierId = await withCarrier({ name: 'Acolyte', ruleset: '5.5' })
  customCarrierId = await withCarrier({ name: 'Sage', characterSheetId: 1 })

  const migration = await readFile(MIGRATIONS_DIR + MIGRATION, 'utf8')
  for (let pass = 0; pass < 2; pass++) {
    for (const statement of splitSqlQueries(migration)) await client.execute(statement)
  }
})

describe('migration 0108 — choix des historiques', () => {
  for (const bg of backgroundsData) {
    it(`${bg.name} : exactement les points de choix du seed, même rejouée`, async () => {
      const expected = [...backgroundChoices(bg)].sort((a, b) => b.kind.localeCompare(a.kind))
      expect(await progressionsOf(carrierIdByBackground.get(bg.name)!)).toEqual(expected)
    })
  }

  it('ignore l\'homonyme 5.5 et l\'historique personnalisé d\'une fiche', async () => {
    expect(await progressionsOf(homonymCarrierId)).toEqual([])
    expect(await progressionsOf(customCarrierId)).toEqual([])
  })
})
