import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { and, eq } from 'drizzle-orm'
import * as srcSchema from '../../server/db/schema'
import { CreatureSize } from '../../server/db/schema/character_species'
import { seedLineages } from '../../server/db/seeds/lib/seedLineages'
import { deriveChosenLineage } from '../../server/utils/lineageDerivation'
import { migrateDragonbornLineage } from '../../server/db/seeds/lib/migrateDragonbornLineage'
import { dragonborn, DRAGONBORN_LINEAGE_BY_ANCESTRY } from '../../server/db/seeds/data/dragonborn'
import { dragonbornAncestryDamageType, allDragonbornAncestries } from '../../shared/utils/draconic_ancestry'

// Rollout lot 6 (chantier lignée, D17) — Drakéide, bout en bout : seed base+10 lignées, DÉRIVATION
// (résistance concrète == ce que l'ancienne colonne résolvait) et MIGRATION BESPOKE (colonne
// dragonbornAncestry → lignée). Prouve que le passage colonne→lignée préserve la résistance affichée.

const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations') + '/'
const NUXTHUB_UTILS = pathToFileURL(join(process.cwd(), 'node_modules', '@nuxthub', 'core', 'dist', 'db', 'lib', 'utils.mjs')).href

let orm: ReturnType<typeof drizzle>
let baseId: number
let legacyId: number
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
  await seedLineages(orm as any, dragonborn)

  baseId = (await orm.select({ id: srcSchema.characterSpecies.id }).from(srcSchema.characterSpecies)
    .where(and(eq(srcSchema.characterSpecies.name, 'Drakéide'), eq(srcSchema.characterSpecies.ruleset, '5'))))[0]!.id
  const baseFeatureIds = (await orm.select({ featureId: srcSchema.speciesFeatures.featureId })
    .from(srcSchema.speciesFeatures).where(eq(srcSchema.speciesFeatures.speciesId, baseId))).map(r => r.featureId)
  progId = (await orm.select().from(srcSchema.progression).where(eq(srcSchema.progression.kind, 'lineage')))
    .find(p => baseFeatureIds.includes(p.featureId))!.id
  for (const l of await orm.select().from(srcSchema.speciesLineages).where(eq(srcSchema.speciesLineages.speciesId, baseId))) {
    lineageIdByName.set(l.name, l.id)
  }

  // Espèce LEGACY « Drakéide (2014) » (simule l'espèce mono renommée par 0088).
  legacyId = (await orm.insert(srcSchema.characterSpecies).values({ name: 'Drakéide (2014)', ruleset: '5', size: CreatureSize.Medium, speed: 9 }).returning().get()).id
})

describe('Drakéide — seed + dérivation (D17, lot 6)', () => {
  for (const key of allDragonbornAncestries) {
    it(`base + « ${DRAGONBORN_LINEAGE_BY_ANCESTRY[key]} » dérive la résistance ${dragonbornAncestryDamageType[key]}`, async () => {
      const lineageId = lineageIdByName.get(DRAGONBORN_LINEAGE_BY_ANCESTRY[key]!)!
      const sheet = await orm.insert(srcSchema.characterSheets).values({ name: `Drk ${key}`, speciesId: baseId }).returning().get()
      await orm.insert(srcSchema.characterChoices).values({ characterSheetId: sheet.id, progressionId: progId, selectedLineageId: lineageId })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const derived = await deriveChosenLineage(orm as any, sheet.id, baseId, 20)
      expect(resistanceOf(derived)).toBe(dragonbornAncestryDamageType[key])
      expect(derived.speedOverride).toBeNull()
    })
  }
})

describe('Drakéide — migration bespoke colonne → lignée (D17, lot 6)', () => {
  it('migre une fiche colonne=red → base + lignée Dragon rouge, résistance préservée', async () => {
    const sheet = await orm.insert(srcSchema.characterSheets).values({ name: 'Legacy red', speciesId: legacyId, dragonbornAncestry: 'red' }).returning().get()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const report = await migrateDragonbornLineage(orm as any)
    expect(report.migrated).toBeGreaterThanOrEqual(1)
    expect(report.byLineage['Dragon rouge']).toBeGreaterThanOrEqual(1)

    const after = (await orm.select().from(srcSchema.characterSheets).where(eq(srcSchema.characterSheets.id, sheet.id)))[0]!
    expect(after.speciesId).toBe(baseId)
    const choice = (await orm.select().from(srcSchema.characterChoices)
      .where(eq(srcSchema.characterChoices.characterSheetId, sheet.id)))[0]!
    expect(choice.selectedLineageId).toBe(lineageIdByName.get('Dragon rouge'))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const derived = await deriveChosenLineage(orm as any, sheet.id, baseId, 20)
    expect(resistanceOf(derived)).toBe('fire')
  })

  it('idempotent : rejouer n\'ajoute pas de doublon de choix', async () => {
    const sheet = await orm.insert(srcSchema.characterSheets).values({ name: 'Legacy white', speciesId: legacyId, dragonbornAncestry: 'white' }).returning().get()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await migrateDragonbornLineage(orm as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await migrateDragonbornLineage(orm as any)
    const choices = await orm.select().from(srcSchema.characterChoices).where(eq(srcSchema.characterChoices.characterSheetId, sheet.id))
    expect(choices.length).toBe(1)
    expect(choices[0]!.selectedLineageId).toBe(lineageIdByName.get('Dragon blanc'))
  })

  it('ascendance NULL non mappable → fiche laissée sur la legacy (comportement inchangé)', async () => {
    const sheet = await orm.insert(srcSchema.characterSheets).values({ name: 'Legacy none', speciesId: legacyId, dragonbornAncestry: null }).returning().get()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const report = await migrateDragonbornLineage(orm as any)
    const after = (await orm.select().from(srcSchema.characterSheets).where(eq(srcSchema.characterSheets.id, sheet.id)))[0]!
    expect(after.speciesId).toBe(legacyId)
    expect(report.skipped.some(s => s.includes(String(sheet.id)))).toBe(true)
  })
})
