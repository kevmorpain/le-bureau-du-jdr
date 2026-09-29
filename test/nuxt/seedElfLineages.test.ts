import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { and, eq } from 'drizzle-orm'
import * as schema from '../../server/db/schema'
import { seedElfLineages } from '../../server/db/seeds/lib/seedElfLineages'
import { buildCatalog } from '../../server/utils/catalog'
import { replayMigrations } from '../fixtures/migrations'

// Logique de seed de l'Elfe base + lignées : structure posée (espèce de base, 3 lignées, feature de
// choix + progression `kind:'lineage'`, features de base vs de lignée) et idempotence.

let orm: ReturnType<typeof drizzle>
let baseId: number

beforeAll(async () => {
  const client = createClient({ url: ':memory:' })
  await client.execute('PRAGMA foreign_keys = ON')
  await replayMigrations(client)
  orm = drizzle(client, { schema, casing: 'snake_case' })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await seedElfLineages(orm as any)

  const base = await orm.select({ id: schema.characterSpecies.id }).from(schema.characterSpecies)
    .where(and(eq(schema.characterSpecies.name, 'Elfe'), eq(schema.characterSpecies.ruleset, '5')))
  baseId = base[0]!.id
})

describe('seedElfLineages — structure', () => {
  it('insère l\'Elfe base (ruleset \'5\') + exactement 3 lignées', async () => {
    const species = await orm.select().from(schema.characterSpecies).where(eq(schema.characterSpecies.name, 'Elfe'))
    expect(species).toHaveLength(1)
    expect(species[0]!.ruleset).toBe('5')

    const lineages = await orm.select().from(schema.speciesLineages).where(eq(schema.speciesLineages.speciesId, baseId))
    expect(lineages.map(l => l.name).sort()).toEqual(['Drow', 'Elfe des bois', 'Haut-elfe'])
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
      .select({ name: schema.features.name, type: schema.features.featureType })
      .from(schema.features)
      .innerJoin(schema.speciesFeatures, eq(schema.speciesFeatures.featureId, schema.features.id))
      .where(eq(schema.speciesFeatures.speciesId, baseId))
    const names = rows.map(r => r.name)
    expect(names).toContain('Sens aiguisés')
    expect(names).toContain('Ascendance féerique')
    expect(names).toContain('Lignage elfique')
    for (const r of rows) expect(r.type).toBe('species_trait')
  })

  it('les features de lignée portent lineage_id + feature_type \'lineage_feature\'', async () => {
    const lineages = await orm.select().from(schema.speciesLineages).where(eq(schema.speciesLineages.speciesId, baseId))
    const haut = lineages.find(l => l.name === 'Haut-elfe')!
    const feats = await orm
      .select({ name: schema.features.name, type: schema.features.featureType })
      .from(schema.features)
      .where(eq(schema.features.lineageId, haut.id))
    expect(feats.length).toBeGreaterThan(0)
    for (const f of feats) expect(f.type).toBe('lineage_feature')
    expect(feats.map(f => f.name)).toContain('Sort mineur') // trait propre du haut-elfe
  })

  it('idempotent : relancer le seed n\'insère rien de plus', async () => {
    const before = await orm.select().from(schema.speciesLineages).where(eq(schema.speciesLineages.speciesId, baseId))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = await seedElfLineages(orm as any)
    expect(r).toEqual({ speciesInserted: 0, lineagesInserted: 0, featuresInserted: 0 })
    const after = await orm.select().from(schema.speciesLineages).where(eq(schema.speciesLineages.speciesId, baseId))
    expect(after).toHaveLength(before.length)
  })
})
