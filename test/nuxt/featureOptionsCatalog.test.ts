import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../../server/db/schema'
import { loadFeatureOptions } from '../../server/utils/catalogSources'
import { replayMigrations } from '../fixtures/migrations'

// Nom et description des options d'un point de choix, par identifiant : seules les features taguées sont des options.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any

beforeAll(async () => {
  const client = createClient({ url: ':memory:' })
  await replayMigrations(client)
  db = drizzle(client, { schema, casing: 'snake_case' })
  await db.insert(schema.features).values([
    { id: 1, name: 'Parade', description: 'Réduit les dégâts.', featureType: 'class_feature', tag: 'maneuver' },
    { id: 2, name: 'Feinte', description: 'Avantage.', featureType: 'class_feature', tag: 'maneuver' },
    { id: 3, name: 'Second souffle', description: 'Soins.', featureType: 'class_feature' },
  ])
})

describe('loadFeatureOptions', () => {
  it('rend les options demandées, par ordre alphabétique', async () => {
    expect(await loadFeatureOptions(db, [1, 2])).toEqual([
      { id: 2, name: 'Feinte', description: 'Avantage.' },
      { id: 1, name: 'Parade', description: 'Réduit les dégâts.' },
    ])
  })

  it('ignore une feature sans tag et un identifiant inconnu', async () => {
    expect(await loadFeatureOptions(db, [3, 999])).toEqual([])
  })
})
