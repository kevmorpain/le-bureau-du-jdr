import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { and, eq } from 'drizzle-orm'
import * as schema from '../../server/db/schema'
import { seedLineages } from '../../server/db/seeds/lib/seedLineages'
import { deriveChosenLineage } from '../../server/utils/lineageDerivation'
import { dragonborn } from '../../server/db/seeds/data/dragonborn'
import { replayMigrations } from '../fixtures/migrations'

// Seed base + 10 lignées et dérivation : la résistance dérivée est le type de dégâts concret de l'ascendance.
const RESISTANCE_BY_LINEAGE: Record<string, string> = {
  'Dragon noir': 'acid',
  'Dragon bleu': 'lightning',
  'Dragon d\'airain': 'fire',
  'Dragon de bronze': 'lightning',
  'Dragon de cuivre': 'acid',
  'Dragon d\'or': 'fire',
  'Dragon vert': 'poison',
  'Dragon rouge': 'fire',
  'Dragon d\'argent': 'cold',
  'Dragon blanc': 'cold',
}

let orm: ReturnType<typeof drizzle>
let baseId: number
let progId: number
const lineageIdByName = new Map<string, number>()

function resistanceOf(derived: Awaited<ReturnType<typeof deriveChosenLineage>>): string | null {
  for (const d of derived.features) {
    for (const fe of d.feature.featureEffects) {
      if (fe.effect.type === 'damage_resistance') return (fe.effect.value as { damageType: string }).damageType
    }
  }
  return null
}

beforeAll(async () => {
  const client = createClient({ url: ':memory:' })
  await client.execute('PRAGMA foreign_keys = ON')
  await replayMigrations(client)
  orm = drizzle(client, { schema, casing: 'snake_case' })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await seedLineages(orm as any, dragonborn)

  baseId = (await orm.select({ id: schema.characterSpecies.id }).from(schema.characterSpecies)
    .where(and(eq(schema.characterSpecies.name, 'Drakéide'), eq(schema.characterSpecies.ruleset, '5'))))[0]!.id
  const baseFeatureIds = (await orm.select({ featureId: schema.speciesFeatures.featureId })
    .from(schema.speciesFeatures).where(eq(schema.speciesFeatures.speciesId, baseId))).map(r => r.featureId)
  progId = (await orm.select().from(schema.progression).where(eq(schema.progression.kind, 'lineage')))
    .find(p => baseFeatureIds.includes(p.featureId))!.id
  for (const l of await orm.select().from(schema.speciesLineages).where(eq(schema.speciesLineages.speciesId, baseId))) {
    lineageIdByName.set(l.name, l.id)
  }
})

describe('Drakéide — seed + dérivation (D17, lot 6)', () => {
  it('seede exactement les 10 ascendances', () => {
    expect([...lineageIdByName.keys()].sort()).toEqual(Object.keys(RESISTANCE_BY_LINEAGE).sort())
  })

  for (const [lineageName, damageType] of Object.entries(RESISTANCE_BY_LINEAGE)) {
    it(`base + « ${lineageName} » dérive la résistance ${damageType}`, async () => {
      const lineageId = lineageIdByName.get(lineageName)!
      const sheet = await orm.insert(schema.characterSheets).values({ name: `Drk ${lineageName}`, speciesId: baseId }).returning().get()
      await orm.insert(schema.characterChoices).values({ characterSheetId: sheet.id, progressionId: progId, selectedLineageId: lineageId })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const derived = await deriveChosenLineage(orm as any, sheet.id, baseId, 20)
      expect(resistanceOf(derived)).toBe(damageType)
      expect(derived.speedOverride).toBeNull()
    })
  }
})
