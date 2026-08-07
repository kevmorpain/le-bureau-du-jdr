import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as srcSchema from '../../server/db/schema'
import { CreatureSize } from '../../server/db/schema/character_species'
import { buildCatalog } from '../../server/utils/catalog'
import { resolveChoices, dueChoices } from '../../shared/rules/resolve'

// Lot 2 du chantier lignée (D17). Ferme la boucle seed↔migration↔loader↔resolve pour un point
// de choix possédé par une ESPÈCE : une feature `species_trait` « Lignage elfique » liée à
// l'Elfe via `species_features`, portant une `progression` `kind:'lineage'` /
// `optionSource:{type:'lineages'}`. On vérifie que `buildCatalog` résout l'espèce propriétaire
// (via species_features), énumère les lignées de cette espèce, et que `resolveChoices` offre le
// choix à un perso de cette espèce.

const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations') + '/'
const NUXTHUB_UTILS = pathToFileURL(join(process.cwd(), 'node_modules', '@nuxthub', 'core', 'dist', 'db', 'lib', 'utils.mjs')).href
const ELF = 3
const LINEAGE_FEATURE = 200

let orm: ReturnType<typeof drizzle>

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

  // Espèce de base + ses 3 lignées (insérées dans le désordre — l'ordre du résultat suit l'id).
  await orm.insert(srcSchema.characterSpecies).values({ id: ELF, name: 'Elfe', size: CreatureSize.Medium, speed: 9 })
  await orm.insert(srcSchema.speciesLineages).values([
    { id: 12, speciesId: ELF, name: 'Elfe noir' },
    { id: 10, speciesId: ELF, name: 'Haut-elfe' },
    { id: 11, speciesId: ELF, name: 'Elfe des bois' },
  ])
  // Une autre espèce + lignée, pour vérifier que le filtre est bien par espèce propriétaire.
  await orm.insert(srcSchema.characterSpecies).values({ id: 4, name: 'Nain', size: CreatureSize.Medium, speed: 7.5 })
  await orm.insert(srcSchema.speciesLineages).values({ id: 20, speciesId: 4, name: 'Nain des montagnes' })

  // Feature d'espèce « Lignage elfique » (species_trait, sans classe/sous-classe) liée à l'Elfe,
  // portant le point de choix de lignée.
  await orm.insert(srcSchema.features).values({ id: LINEAGE_FEATURE, name: 'Lignage elfique', featureType: 'species_trait', levelRequired: 1 })
  await orm.insert(srcSchema.speciesFeatures).values({ speciesId: ELF, featureId: LINEAGE_FEATURE })
  await orm.insert(srcSchema.progression).values({
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
