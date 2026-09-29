import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { and, eq } from 'drizzle-orm'
import * as schema from '../../server/db/schema'
import { seedLineages } from '../../server/db/seeds/lib/seedLineages'
import { deriveChosenLineage } from '../../server/utils/lineageDerivation'
import { characterSpecies } from '../../server/db/seeds/data/character_species'
import { dwarf } from '../../server/db/seeds/data/dwarf'
import { halfling } from '../../server/db/seeds/data/halfling'
import { gnome } from '../../server/db/seeds/data/gnome'
import { tiefling } from '../../server/db/seeds/data/tiefling'
import { replayMigrations } from '../fixtures/migrations'

// Seed + dérivation pour Nain/Halfelin/Gnome/Tieffelin : base ⊕ lignée dérive exactement les effets
// de l'ancienne espèce séparée. « Vitesse » est portée par la BASE → aucune surcharge attendue.

interface Eff { type: string, value: unknown }
function stable(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v)
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`
  const o = v as Record<string, unknown>
  return `{${Object.keys(o).sort().map(k => `${JSON.stringify(k)}:${stable(o[k])}`).join(',')}}`
}
const asSet = (effs: Eff[]) => effs.map(e => stable({ type: e.type, value: e.value })).sort()

const ROLLOUT = [dwarf, halfling, gnome, tiefling]
// Alias lignée → ancienne espèce (quand le nom diffère, ex. Asmodée → « Tieffelin (Asmodée) »).
const LEGACY_ALIAS: Record<string, string> = { 'Asmodée': 'Tieffelin (Asmodée)' }

let orm: ReturnType<typeof drizzle>
const info: Record<string, { baseId: number, baseEffects: Eff[], sheetByLineage: Record<string, number> }> = {}

beforeAll(async () => {
  const client = createClient({ url: ':memory:' })
  await client.execute('PRAGMA foreign_keys = ON')
  await replayMigrations(client)
  orm = drizzle(client, { schema, casing: 'snake_case' })

  for (const sp of ROLLOUT) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await seedLineages(orm as any, sp)

    const baseId = (await orm.select({ id: schema.characterSpecies.id }).from(schema.characterSpecies)
      .where(and(eq(schema.characterSpecies.name, sp.name), eq(schema.characterSpecies.ruleset, '5'))))[0]!.id

    // Progression de CETTE base (une feature d'espèce de la base porte la progression lignée).
    const baseFeatureIds = (await orm.select({ featureId: schema.speciesFeatures.featureId })
      .from(schema.speciesFeatures).where(eq(schema.speciesFeatures.speciesId, baseId))).map(r => r.featureId)
    const prog = (await orm.select().from(schema.progression).where(eq(schema.progression.kind, 'lineage')))
      .find(p => baseFeatureIds.includes(p.featureId))!

    const baseEffects = (await orm
      .select({ type: schema.effects.type, value: schema.effects.value })
      .from(schema.speciesFeatures)
      .innerJoin(schema.features, eq(schema.speciesFeatures.featureId, schema.features.id))
      .innerJoin(schema.featureEffects, eq(schema.featureEffects.featureId, schema.features.id))
      .innerJoin(schema.effects, eq(schema.featureEffects.effectId, schema.effects.id))
      .where(eq(schema.speciesFeatures.speciesId, baseId)))
      .map(r => ({ type: r.type, value: r.value }))

    const sheetByLineage: Record<string, number> = {}
    const lineages = await orm.select().from(schema.speciesLineages).where(eq(schema.speciesLineages.speciesId, baseId))
    for (const lin of lineages) {
      const sheet = await orm.insert(schema.characterSheets).values({ name: `Test ${lin.name}`, speciesId: baseId }).returning().get()
      await orm.insert(schema.characterChoices).values({ characterSheetId: sheet.id, progressionId: prog.id, selectedLineageId: lin.id })
      sheetByLineage[lin.name] = sheet.id
    }
    info[sp.name] = { baseId, baseEffects, sheetByLineage }
  }
})

describe('Rollout lot 6 — seed + dérivation lignée, équivalence bout en bout (D17)', () => {
  for (const sp of ROLLOUT) {
    for (const lin of sp.lineages) {
      const legacyName = LEGACY_ALIAS[lin.name] ?? lin.name
      it(`${sp.name} base + « ${lin.name} » dérive les mêmes effets que l'ancienne « ${legacyName} »`, async () => {
        const { baseId, baseEffects, sheetByLineage } = info[sp.name]!
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const derived = await deriveChosenLineage(orm as any, sheetByLineage[lin.name]!, baseId, 20)
        const lineageEffects: Eff[] = derived.features.flatMap(d => d.feature.featureEffects.map(fe => ({ type: fe.effect.type, value: fe.effect.value })))

        const rebuilt = asSet([...baseEffects, ...lineageEffects])
        const old = characterSpecies.find(s => s.name === legacyName) as { traits: { effects: Eff[] }[] }
        expect(rebuilt).toEqual(asSet(old.traits.flatMap(t => t.effects)))

        // Vitesse commune sur la base → aucune surcharge.
        expect(derived.speedOverride).toBeNull()
      })
    }
  }
})
