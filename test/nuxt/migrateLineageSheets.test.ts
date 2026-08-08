import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { and, eq, isNotNull } from 'drizzle-orm'
import * as srcSchema from '../../server/db/schema'
import { CreatureSize } from '../../server/db/schema/character_species'
import { seedElfLineages } from '../../server/db/seeds/lib/seedElfLineages'
import { migrateLineageSheets } from '../../server/db/seeds/lib/migrateLineageSheets'
import { deriveChosenLineage } from '../../server/utils/lineageDerivation'
import { characterSpecies as speciesData } from '../../server/db/seeds/data/character_species'

// Lot 4 (chantier lignée, D17) — migration des fiches VIVANTES vers base+lignée. On seede la
// structure Elfe base+lignées, on crée des fiches VIEUX modèle (species_id → ancienne espèce
// séparée), on lance la migration, puis on vérifie : repointage vers la base, choix de lignée
// homonyme posé, fiche non-elfe intacte, idempotence, et ÉQUIVALENCE (base ⊕ lignée dérivée ==
// anciens effets — le filet qui garantit qu'une fiche migrée ne change pas de règles).

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let orm: any
let baseId: number
let baseEffects: Eff[]
const legacyByName: Record<string, number> = {}
const sheetByLineage: Record<string, number> = {}
let humanSheetId: number
let humanSpeciesId: number
let firstReport: Awaited<ReturnType<typeof migrateLineageSheets>>

// Les 3 anciennes espèces séparées, homonymes des lignées de l'Elfe base.
const LEGACY = ['Haut-elfe', 'Elfe des bois', 'Elfe noir'] as const

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
  await seedElfLineages(orm)

  baseId = (await orm.select({ id: srcSchema.characterSpecies.id }).from(srcSchema.characterSpecies)
    .where(and(eq(srcSchema.characterSpecies.name, 'Elfe'), eq(srcSchema.characterSpecies.ruleset, '5'))))[0]!.id

  // Effets des traits de BASE — communs à toutes les lignées.
  baseEffects = (await orm
    .select({ type: srcSchema.effects.type, value: srcSchema.effects.value })
    .from(srcSchema.speciesFeatures)
    .innerJoin(srcSchema.features, eq(srcSchema.speciesFeatures.featureId, srcSchema.features.id))
    .innerJoin(srcSchema.featureEffects, eq(srcSchema.featureEffects.featureId, srcSchema.features.id))
    .innerJoin(srcSchema.effects, eq(srcSchema.featureEffects.effectId, srcSchema.effects.id))
    .where(eq(srcSchema.speciesFeatures.speciesId, baseId)))
    .map((r: Eff) => ({ type: r.type, value: r.value }))

  // Anciennes espèces séparées (rows minimales : la migration ne lit que species_id) + une fiche each.
  for (const name of LEGACY) {
    const sp = await orm.insert(srcSchema.characterSpecies)
      .values({ name, ruleset: '5', size: CreatureSize.Medium, speed: 9 }).returning().get()
    legacyByName[name] = sp.id
    const sheet = await orm.insert(srcSchema.characterSheets)
      .values({ name: `Vieux ${name}`, speciesId: sp.id }).returning().get()
    sheetByLineage[name] = sheet.id
  }

  // Fiche non-elfe (Humain) — doit rester intacte.
  const human = await orm.insert(srcSchema.characterSpecies)
    .values({ name: 'Humain', ruleset: '5', size: CreatureSize.Medium, speed: 9 }).returning().get()
  humanSpeciesId = human.id
  humanSheetId = (await orm.insert(srcSchema.characterSheets)
    .values({ name: 'Un humain', speciesId: human.id }).returning().get()).id

  firstReport = await migrateLineageSheets(orm)
})

describe('migration des fiches vers base+lignée (D17, lot 4)', () => {
  it('rapporte 3 fiches migrées, une par lignée', () => {
    expect(firstReport.migrated).toBe(3)
    expect(firstReport.choicesInserted).toBe(3)
    expect(firstReport.byLineage).toEqual({ 'Haut-elfe': 1, 'Elfe des bois': 1, 'Elfe noir': 1 })
    expect(firstReport.skipped).toEqual([])
  })

  it('repointe chaque fiche vers la base Elfe et pose le choix de lignée homonyme', async () => {
    for (const name of LEGACY) {
      const sheetId = sheetByLineage[name]!
      const sheet = await orm.select().from(srcSchema.characterSheets)
        .where(eq(srcSchema.characterSheets.id, sheetId)).limit(1).get()
      expect(sheet.speciesId).toBe(baseId)

      const lineage = await orm.select().from(srcSchema.speciesLineages)
        .where(and(eq(srcSchema.speciesLineages.speciesId, baseId), eq(srcSchema.speciesLineages.name, name)))
        .limit(1).get()
      const choices = await orm.select().from(srcSchema.characterChoices)
        .where(eq(srcSchema.characterChoices.characterSheetId, sheetId))
      expect(choices).toHaveLength(1)
      expect(choices[0].selectedLineageId).toBe(lineage.id)
    }
  })

  it('laisse la fiche non-elfe intacte (species inchangée, aucun choix)', async () => {
    const sheet = await orm.select().from(srcSchema.characterSheets)
      .where(eq(srcSchema.characterSheets.id, humanSheetId)).limit(1).get()
    expect(sheet.speciesId).toBe(humanSpeciesId)
    const choices = await orm.select().from(srcSchema.characterChoices)
      .where(eq(srcSchema.characterChoices.characterSheetId, humanSheetId))
    expect(choices).toHaveLength(0)
  })

  it('est idempotente : rejouer ne migre rien et ne duplique aucun choix', async () => {
    const before = (await orm.select({ id: srcSchema.characterChoices.id }).from(srcSchema.characterChoices)
      .where(isNotNull(srcSchema.characterChoices.selectedLineageId))).length
    const again = await migrateLineageSheets(orm)
    expect(again.migrated).toBe(0)
    expect(again.choicesInserted).toBe(0)
    const after = (await orm.select({ id: srcSchema.characterChoices.id }).from(srcSchema.characterChoices)
      .where(isNotNull(srcSchema.characterChoices.selectedLineageId))).length
    expect(after).toBe(before)
  })

  for (const name of LEGACY) {
    it(`fiche migrée « ${name} » : base ⊕ lignée dérive les mêmes effets que l'ancienne espèce`, async () => {
      const derived = await deriveChosenLineage(orm, sheetByLineage[name]!, baseId, 20)
      const lineageEffects: Eff[] = derived.features.flatMap(
        d => d.feature.featureEffects.map((fe: { effect: Eff }) => ({ type: fe.effect.type, value: fe.effect.value })),
      )
      const rebuilt = asSet([...baseEffects, ...lineageEffects])
      const old = speciesData.find(s => s.name === name) as { traits: { effects: Eff[] }[] }
      expect(rebuilt).toEqual(asSet(old.traits.flatMap(t => t.effects)))
    })
  }

  it('ignore une base sans structure de lignée seedée (garde défensif)', async () => {
    // 'Nain' n'a ni base+lignées ni progression → aucune migration, aucun crash.
    const report = await migrateLineageSheets(orm, ['Nain'])
    expect(report.migrated).toBe(0)
    expect(report.choicesInserted).toBe(0)
  })
})
