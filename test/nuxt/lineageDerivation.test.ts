import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { and, eq } from 'drizzle-orm'
import * as srcSchema from '../../server/db/schema'
import { seedElfLineages } from '../../server/db/seeds/lib/seedElfLineages'
import { deriveChosenLineage } from '../../server/utils/lineageDerivation'
import { characterSpecies } from '../../server/db/seeds/data/character_species'

// Lot 3b-2 (chantier lignée, D17) — ÉQUIVALENCE BOUT EN BOUT de la dérivation (D12). On seede la
// structure Elfe base+lignées, on crée des persos « Elfe base + lignée choisie », on DÉRIVE
// (util `deriveChosenLineage`), et on vérifie que l'ENSEMBLE des effets (traits de base ⊕
// features de la lignée) est EXACTEMENT celui de l'ancienne espèce séparée — plus la surcharge
// de vitesse (Elfe des bois 10,5 m). Preuve qu'une fiche migrée (lot 4) ne changera pas de règles.

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

let orm: ReturnType<typeof drizzle>
let baseId: number
let baseEffects: Eff[]
const charByLineage: Record<string, number> = {}

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await seedElfLineages(orm as any)

  baseId = (await orm.select({ id: srcSchema.characterSpecies.id }).from(srcSchema.characterSpecies)
    .where(and(eq(srcSchema.characterSpecies.name, 'Elfe'), eq(srcSchema.characterSpecies.ruleset, '5'))))[0]!.id
  const lineageProg = (await orm.select({ id: srcSchema.progression.id }).from(srcSchema.progression)
    .where(eq(srcSchema.progression.kind, 'lineage')))[0]!

  // Effets des traits de BASE (species_features de l'Elfe base) — communs à toutes les lignées.
  baseEffects = (await orm
    .select({ type: srcSchema.effects.type, value: srcSchema.effects.value })
    .from(srcSchema.speciesFeatures)
    .innerJoin(srcSchema.features, eq(srcSchema.speciesFeatures.featureId, srcSchema.features.id))
    .innerJoin(srcSchema.featureEffects, eq(srcSchema.featureEffects.featureId, srcSchema.features.id))
    .innerJoin(srcSchema.effects, eq(srcSchema.featureEffects.effectId, srcSchema.effects.id))
    .where(eq(srcSchema.speciesFeatures.speciesId, baseId)))
    .map(r => ({ type: r.type, value: r.value }))

  // Une fiche « Elfe base + lignée L » par lignée.
  const lineages = await orm.select().from(srcSchema.speciesLineages).where(eq(srcSchema.speciesLineages.speciesId, baseId))
  for (const lin of lineages) {
    const sheet = await orm.insert(srcSchema.characterSheets).values({ name: `Test ${lin.name}`, speciesId: baseId }).returning().get()
    await orm.insert(srcSchema.characterChoices).values({ characterSheetId: sheet.id, progressionId: lineageProg.id, selectedLineageId: lin.id })
    charByLineage[lin.name] = sheet.id
  }
})

const CASES = [
  { lineage: 'Haut-elfe', species: 'Haut-elfe', speed: null }, // 9 = vitesse de base → pas de surcharge
  { lineage: 'Elfe des bois', species: 'Elfe des bois', speed: 10.5 },
  { lineage: 'Elfe noir', species: 'Elfe noir', speed: null }, // 9 = base
]

describe('dérivation lignée — équivalence bout en bout (D17)', () => {
  for (const { lineage, species, speed } of CASES) {
    it(`Elfe base + « ${lineage} » dérive les mêmes effets que l'ancienne « ${species} » (+ vitesse)`, async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const derived = await deriveChosenLineage(orm as any, charByLineage[lineage]!, baseId, 20)
      const lineageEffects: Eff[] = derived.features.flatMap(d => d.feature.featureEffects.map(fe => ({ type: fe.effect.type, value: fe.effect.value })))

      const rebuilt = asSet([...baseEffects, ...lineageEffects])
      const old = characterSpecies.find(s => s.name === species) as { traits: { effects: Eff[] }[] }
      expect(rebuilt).toEqual(asSet(old.traits.flatMap(t => t.effects)))

      // Surcharge de vitesse : la fiche lit species.speed → la lignée « rapide » doit l'imposer.
      expect(derived.speedOverride).toBe(speed === null ? 9 : speed)
    })
  }

  it('sans lignée choisie → dérivation vide (no-op pour les fiches existantes)', async () => {
    const sheet = await orm.insert(srcSchema.characterSheets).values({ name: 'Sans lignée', speciesId: baseId }).returning().get()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const derived = await deriveChosenLineage(orm as any, sheet.id, baseId, 20)
    expect(derived).toEqual({ features: [], speedOverride: null })
  })
})
