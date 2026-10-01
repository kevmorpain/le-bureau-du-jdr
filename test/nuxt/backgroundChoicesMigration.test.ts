import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../../server/db/schema'
import { backgroundsData } from '../../server/db/seeds/data/backgrounds'
import { BACKGROUND_PROFICIENCY_CARRIER_NAME } from '../../server/db/seeds/lib/seedBackgroundProficiencies'
import { backgroundChoices } from '../../shared/rules/backgroundProficiencies'
import type { FeatureChoice } from '../../shared/rules/choices'
import { applyMigration, replayMigrations } from '../fixtures/migrations'

// Migration 0110 : sur une base déployée, chaque historique prédéfini reçoit sur son porteur les points de
// choix que le seed déclare (`backgroundChoices`).

const MIGRATION = '0110_background_choices.sql'

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
  client = createClient({ url: ':memory:' })
  await replayMigrations(client)
  const orm = drizzle(client, { schema, casing: 'snake_case' })

  const withCarrier = async (values: typeof schema.backgrounds.$inferInsert) => {
    const bg = await orm.insert(schema.backgrounds).values(values).returning().get()
    const carrier = await orm.insert(schema.features)
      .values({ name: BACKGROUND_PROFICIENCY_CARRIER_NAME, featureType: 'proficiency_grant', levelRequired: 1 })
      .returning().get()
    await orm.insert(schema.backgroundFeatures).values({ backgroundId: bg.id, featureId: carrier.id })
    return carrier.id
  }
  for (const bg of backgroundsData) carrierIdByBackground.set(bg.name, await withCarrier({ name: bg.name }))
  homonymCarrierId = await withCarrier({ name: 'Acolyte', ruleset: '5.5' })
  customCarrierId = await withCarrier({ name: 'Sage', characterSheetId: 1 })

  for (let pass = 0; pass < 2; pass++) await applyMigration(client, MIGRATION)
})

describe('migration 0110 — choix des historiques', () => {
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
