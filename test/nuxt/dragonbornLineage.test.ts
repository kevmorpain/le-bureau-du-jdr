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
import { dragonborn, DRAGONBORN_LINEAGE_BY_ANCESTRY } from '../../server/db/seeds/data/dragonborn'
import { dragonbornAncestryDamageType, allDragonbornAncestries } from '../../shared/utils/draconic_ancestry'

// Rollout lot 6 (chantier lignée, D17) — Drakéide, seed base+10 lignées + DÉRIVATION : la résistance
// dérivée est CONCRÈTE et vaut ce que l'ancienne colonne dragonbornAncestry résolvait
// (`dragonbornAncestryDamageType[X]`) → le passage colonne→lignée préserve la résistance affichée.

const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations') + '/'
const NUXTHUB_UTILS = pathToFileURL(join(process.cwd(), 'node_modules', '@nuxthub', 'core', 'dist', 'db', 'lib', 'utils.mjs')).href

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
