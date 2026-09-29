import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../../server/db/schema'
import { CreatureSize } from '../../server/db/schema/character_species'
import { buildCatalog } from '../../server/utils/catalog'
import { resolveChoices, dueChoices } from '../../shared/rules/resolve'
import { replayMigrations } from '../fixtures/migrations'

// Point de choix possédé par une ESPÈCE : `buildCatalog` doit résoudre l'espèce propriétaire via
// `species_features` et n'énumérer que SES lignées.

const ELF = 3
const LINEAGE_FEATURE = 200

let orm: ReturnType<typeof drizzle>

beforeAll(async () => {
  const client = createClient({ url: ':memory:' })
  await client.execute('PRAGMA foreign_keys = ON')
  await replayMigrations(client)
  orm = drizzle(client, { schema, casing: 'snake_case' })

  // Espèce de base + ses 3 lignées (insérées dans le désordre — l'ordre du résultat suit l'id).
  await orm.insert(schema.characterSpecies).values({ id: ELF, name: 'Elfe', size: CreatureSize.Medium, speed: 9 })
  await orm.insert(schema.speciesLineages).values([
    { id: 12, speciesId: ELF, name: 'Elfe noir' },
    { id: 10, speciesId: ELF, name: 'Haut-elfe' },
    { id: 11, speciesId: ELF, name: 'Elfe des bois' },
  ])
  // Une autre espèce + lignée, pour vérifier que le filtre est bien par espèce propriétaire.
  await orm.insert(schema.characterSpecies).values({ id: 4, name: 'Nain', size: CreatureSize.Medium, speed: 7.5 })
  await orm.insert(schema.speciesLineages).values({ id: 20, speciesId: 4, name: 'Nain des montagnes' })

  // Feature d'espèce « Lignage elfique » (species_trait, sans classe/sous-classe) liée à l'Elfe,
  // portant le point de choix de lignée.
  await orm.insert(schema.features).values({ id: LINEAGE_FEATURE, name: 'Lignage elfique', featureType: 'species_trait', levelRequired: 1 })
  await orm.insert(schema.speciesFeatures).values({ speciesId: ELF, featureId: LINEAGE_FEATURE })
  await orm.insert(schema.progression).values({
    featureId: LINEAGE_FEATURE,
    kind: 'lineage',
    count: { op: 'fixed', value: 1 },
    optionSource: { type: 'lineages' },
    replaceable: false,
  })
})

describe('buildCatalog — choix de lignée (owner = espèce, D17)', () => {
  it('résout l\'espèce propriétaire via species_features et énumère SES lignées', async () => {
    const catalog = await buildCatalog(orm, { speciesIds: [ELF] })
    expect(catalog.progressions).toHaveLength(1)
    const p = catalog.progressions[0]!
    expect(p.kind).toBe('lineage')
    expect(p.ownerSpeciesId).toBe(ELF)
    expect(p.ownerClassId).toBeUndefined()
    expect(p.ownerFeatureId).toBe(LINEAGE_FEATURE)
    // Les 3 lignées de l'Elfe seulement (pas celle du Nain), triées par id.
    expect(p.options!.map(o => o.lineageId)).toEqual([10, 11, 12])
  })

  it('filtre par espèce : speciesIds inconnu → aucune progression', async () => {
    const catalog = await buildCatalog(orm, { speciesIds: [999] })
    expect(catalog.progressions).toHaveLength(0)
  })

  it('bout en bout loader→resolve : un Elfe se voit proposer le choix de lignée', async () => {
    const catalog = await buildCatalog(orm, { speciesIds: [ELF] })
    const { choices } = resolveChoices({ classLevels: { 1: 1 }, speciesId: ELF }, catalog)
    expect(dueChoices({ choices }).map(c => c.kind)).toEqual(['lineage'])
    expect(choices[0]!.options.map(o => o.lineageId)).toEqual([10, 11, 12])

    // Un Nain (autre espèce) ne se voit rien proposer par CE catalogue (filtré Elfe).
    expect(resolveChoices({ classLevels: { 1: 1 }, speciesId: 4 }, catalog).choices).toHaveLength(0)
  })
})
