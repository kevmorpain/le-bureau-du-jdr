import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { and, eq } from 'drizzle-orm'
import * as srcSchema from '../../server/db/schema'
import { seedElfLineages } from '../../server/db/seeds/lib/seedElfLineages'
import { buildCatalog } from '../../server/utils/catalog'

// Lot 3b (chantier lignée, D17) — la LOGIQUE DE SEED de l'Elfe base+lignées. On rejoue toute la
// chaîne de migrations sur libsql, on lance `seedElfLineages` (injecté), puis on vérifie la
// STRUCTURE posée : espèce de base, 3 lignées, feature de choix + progression `kind:'lineage'`
// (bout en bout via `buildCatalog`), features de base vs de lignée, et l'idempotence.
// (L'équivalence des EFFETS est déjà prouvée au niveau donnée par elfLineageEquivalence.test ;
// l'équivalence bout en bout via la fiche viendra avec la dérivation, lot 3b-2.)

const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations') + '/'
const NUXTHUB_UTILS = pathToFileURL(join(process.cwd(), 'node_modules', '@nuxthub', 'core', 'dist', 'db', 'lib', 'utils.mjs')).href

let orm: ReturnType<typeof drizzle>
let baseId: number

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

  const base = await orm.select({ id: srcSchema.characterSpecies.id }).from(srcSchema.characterSpecies)
    .where(and(eq(srcSchema.characterSpecies.name, 'Elfe'), eq(srcSchema.characterSpecies.ruleset, '5')))
  baseId = base[0]!.id
})

describe('seedElfLineages — structure', () => {
  it('insère l\'Elfe base (ruleset \'5\') + exactement 3 lignées', async () => {
    const species = await orm.select().from(srcSchema.characterSpecies).where(eq(srcSchema.characterSpecies.name, 'Elfe'))
    expect(species).toHaveLength(1)
    expect(species[0]!.ruleset).toBe('5')

    const lineages = await orm.select().from(srcSchema.speciesLineages).where(eq(srcSchema.speciesLineages.speciesId, baseId))
    expect(lineages.map(l => l.name).sort()).toEqual(['Elfe des bois', 'Elfe noir', 'Haut-elfe'])
  })

  it('pose la feature de choix + une progression kind:\'lineage\' → 3 options (bout en bout buildCatalog)', async () => {
    const catalog = await buildCatalog(orm, { speciesIds: [baseId] })
    expect(catalog.progressions).toHaveLength(1)
    const p = catalog.progressions[0]!
    expect(p.kind).toBe('lineage')
    expect(p.ownerSpeciesId).toBe(baseId)
    expect(p.options!.map(o => o.lineageId)).toHaveLength(3)
  })

  it('les features de base sont des species_trait liées à la base (dont la feature de choix)', async () => {
    const rows = await orm
      .select({ name: srcSchema.features.name, type: srcSchema.features.featureType })
      .from(srcSchema.features)
      .innerJoin(srcSchema.speciesFeatures, eq(srcSchema.speciesFeatures.featureId, srcSchema.features.id))
      .where(eq(srcSchema.speciesFeatures.speciesId, baseId))
    const names = rows.map(r => r.name)
    expect(names).toContain('Sens aiguisés')
    expect(names).toContain('Ascendance féerique')
    expect(names).toContain('Lignage elfique')
    for (const r of rows) expect(r.type).toBe('species_trait')
  })

  it('les features de lignée portent lineage_id + feature_type \'lineage_feature\'', async () => {
    const lineages = await orm.select().from(srcSchema.speciesLineages).where(eq(srcSchema.speciesLineages.speciesId, baseId))
    const haut = lineages.find(l => l.name === 'Haut-elfe')!
    const feats = await orm
      .select({ name: srcSchema.features.name, type: srcSchema.features.featureType })
      .from(srcSchema.features)
      .where(eq(srcSchema.features.lineageId, haut.id))
    expect(feats.length).toBeGreaterThan(0)
    for (const f of feats) expect(f.type).toBe('lineage_feature')
    expect(feats.map(f => f.name)).toContain('Sort mineur') // trait propre du haut-elfe
  })

  it('idempotent : relancer le seed n\'insère rien de plus', async () => {
    const before = await orm.select().from(srcSchema.speciesLineages).where(eq(srcSchema.speciesLineages.speciesId, baseId))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await seedElfLineages(orm as any)
    expect(r).toEqual({ speciesInserted: 0, lineagesInserted: 0, featuresInserted: 0 })
    const after = await orm.select().from(srcSchema.speciesLineages).where(eq(srcSchema.speciesLineages.speciesId, baseId))
    expect(after).toHaveLength(before.length)
  })
})
