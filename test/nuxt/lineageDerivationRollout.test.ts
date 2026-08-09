import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { and, eq } from 'drizzle-orm'
import * as srcSchema from '../../server/db/schema'
import { seedLineages } from '../../server/db/seeds/lib/seedLineages'
import { deriveChosenLineage } from '../../server/utils/lineageDerivation'
import { characterSpecies } from '../../server/db/seeds/data/character_species'
import { dwarf } from '../../server/db/seeds/data/dwarf'
import { halfling } from '../../server/db/seeds/data/halfling'
import { gnome } from '../../server/db/seeds/data/gnome'
import { tiefling } from '../../server/db/seeds/data/tiefling'

// Rollout lot 6 (chantier lignée, D17) — SEED + DÉRIVATION bout en bout pour Nain/Halfelin/Gnome/
// Tieffelin (l'elfe a `lineageDerivation.test.ts`). Prouve que les DONNÉES traversent le moteur
// générique `seedLineages` sans erreur, puis qu'un perso « base + lignée » DÉRIVE exactement les
// effets de l'ancienne espèce séparée (D12). Le trio + Tieffelin mettent « Vitesse » sur la BASE
// (commune) → aucune surcharge attendue (`speedOverride === null`, la fiche garde species.speed).

const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations') + '/'
const NUXTHUB_UTILS = pathToFileURL(join(process.cwd(), 'node_modules', '@nuxthub', 'core', 'dist', 'db', 'lib', 'utils.mjs')).href

interface Eff { type: string, value: unknown }
function stable(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v)
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`
  const o = v as Record<string, unknown>
  return `{${Object.keys(o).sort().map(k => `${JSON.stringify(k)}:${stable(o[k])}`).join(',')}}`
}
const asSet = (effs: Eff[]) => effs.map(e => stable({ type: e.type, value: e.value })).sort()

const ROLLOUT = [dwarf, halfling, gnome, tiefling]
// Alias lignée → ancienne espèce (quand le nom diffère ; miroir de LINEAGE_TO_LEGACY_SPECIES).
const LEGACY_ALIAS: Record<string, string> = { 'Asmodée': 'Tieffelin (Asmodée)' }

let orm: ReturnType<typeof drizzle>
const info: Record<string, { baseId: number, baseEffects: Eff[], sheetByLineage: Record<string, number> }> = {}

beforeAll(async () => {
  const mod = await import(/* @vite-ignore */ NUXTHUB_UTILS)
  const splitSqlQueries = mod.splitSqlQueries as (sql: string) => string[]
  const files = (await readdir(MIGRATIONS_DIR)).filter(f => f.endsWith('.sql')).sort()
  const client = createClient({ url: ':memory:' })
  await client.execute('PRAGMA foreign_keys = ON')
  for (const file of files) {
    const sql = await readFile(MIGRATIONS_DIR + file, 'utf8')
    for (const statement of splitSqlQueries(sql)) await client.execute(statement)
  }
  orm = drizzle(client, { schema: srcSchema, casing: 'snake_case' })

  for (const sp of ROLLOUT) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await seedLineages(orm as any, sp)

    const baseId = (await orm.select({ id: srcSchema.characterSpecies.id }).from(srcSchema.characterSpecies)
      .where(and(eq(srcSchema.characterSpecies.name, sp.name), eq(srcSchema.characterSpecies.ruleset, '5'))))[0]!.id

    // Progression de CETTE base (une feature d'espèce de la base porte la progression lignée).
    const baseFeatureIds = (await orm.select({ featureId: srcSchema.speciesFeatures.featureId })
      .from(srcSchema.speciesFeatures).where(eq(srcSchema.speciesFeatures.speciesId, baseId))).map(r => r.featureId)
    const prog = (await orm.select().from(srcSchema.progression).where(eq(srcSchema.progression.kind, 'lineage')))
      .find(p => baseFeatureIds.includes(p.featureId))!

    const baseEffects = (await orm
      .select({ type: srcSchema.effects.type, value: srcSchema.effects.value })
      .from(srcSchema.speciesFeatures)
      .innerJoin(srcSchema.features, eq(srcSchema.speciesFeatures.featureId, srcSchema.features.id))
      .innerJoin(srcSchema.featureEffects, eq(srcSchema.featureEffects.featureId, srcSchema.features.id))
      .innerJoin(srcSchema.effects, eq(srcSchema.featureEffects.effectId, srcSchema.effects.id))
      .where(eq(srcSchema.speciesFeatures.speciesId, baseId)))
      .map(r => ({ type: r.type, value: r.value }))

    const sheetByLineage: Record<string, number> = {}
    const lineages = await orm.select().from(srcSchema.speciesLineages).where(eq(srcSchema.speciesLineages.speciesId, baseId))
    for (const lin of lineages) {
      const sheet = await orm.insert(srcSchema.characterSheets).values({ name: `Test ${lin.name}`, speciesId: baseId }).returning().get()
      await orm.insert(srcSchema.characterChoices).values({ characterSheetId: sheet.id, progressionId: prog.id, selectedLineageId: lin.id })
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
