import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../../server/db/schema'
import { buildCatalog } from '../../server/utils/catalog'
import { loadFeats } from '../../server/utils/catalogSources'
import { replayMigrations } from '../fixtures/migrations'

// Un `optionSource:{feats, category}` ne doit proposer QUE les dons de cette catégorie (composé avec
// le filtre d'édition) ; sans catégorie, tous les dons de l'édition.

const CLASS_2024 = 1

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let orm: any

beforeAll(async () => {
  const client = createClient({ url: ':memory:' })
  await client.execute('PRAGMA foreign_keys = ON')
  await replayMigrations(client)
  orm = drizzle(client, { schema, casing: 'snake_case' })

  await orm.insert(schema.classes).values({ id: CLASS_2024, name: 'Classe 2024', hitDice: '1d8', ruleset: '5.5' })

  // Deux features PROPRIÉTAIRES 5.5 : l'une exige des dons d'ORIGINE, l'autre tous les dons.
  await orm.insert(schema.features).values([
    { id: 10, name: 'Point origine', featureType: 'class_feature', classId: CLASS_2024, levelRequired: 1, ruleset: '5.5' },
    { id: 11, name: 'Point général', featureType: 'class_feature', classId: CLASS_2024, levelRequired: 4, ruleset: '5.5' },
  ])
  await orm.insert(schema.progression).values([
    { featureId: 10, kind: 'asi_or_feat', count: { op: 'fixed', value: 1 }, optionSource: { type: 'feats', category: 'origin' }, replaceable: false },
    { featureId: 11, kind: 'asi_or_feat', count: { op: 'fixed', value: 1 }, optionSource: { type: 'feats' }, replaceable: false },
  ])

  // Dons 5.5 catégorisés + un don 2014 legacy (édition '5', sans catégorie) → jamais proposé ici.
  await orm.insert(schema.features).values([
    { id: 40, name: 'Origine A', featureType: 'feat', ruleset: '5.5', featCategory: 'origin' },
    { id: 41, name: 'Général B', featureType: 'feat', ruleset: '5.5', featCategory: 'general' },
    { id: 42, name: 'Origine C', featureType: 'feat', ruleset: '5.5', featCategory: 'origin' },
    { id: 50, name: 'Legacy 2014', featureType: 'feat' }, // ruleset '5', featCategory null
  ])
})

describe('buildCatalog — filtre par catégorie de don (C2)', () => {
  it('optionSource:{feats, category:origin} → uniquement les dons d\'origine de l\'édition', async () => {
    const catalog = await buildCatalog(orm, { classIds: [CLASS_2024] })
    const origin = catalog.progressions.find(p => p.ownerFeatureId === 10)!
    expect(origin.options!.map(o => o.featureId).sort((a, b) => a! - b!)).toEqual([40, 42])
  })

  it('optionSource:{feats} sans catégorie → tous les dons de l\'édition (pas le legacy 2014)', async () => {
    const catalog = await buildCatalog(orm, { classIds: [CLASS_2024] })
    const all = catalog.progressions.find(p => p.ownerFeatureId === 11)!
    expect(all.options!.map(o => o.featureId).sort((a, b) => a! - b!)).toEqual([40, 41, 42])
  })
})

describe('loadFeats — expose la catégorie', () => {
  it('featCategory présent dans la sortie (null pour les dons 2014)', async () => {
    const feats55 = await loadFeats(orm, '5.5')
    const byId = new Map(feats55.map((f: { id: number, featCategory: string | null }) => [f.id, f.featCategory]))
    expect(byId.get(40)).toBe('origin')
    expect(byId.get(41)).toBe('general')

    const feats2014 = await loadFeats(orm) // défaut '5'
    const legacy = feats2014.find((f: { id: number }) => f.id === 50)!
    expect((legacy as { featCategory: string | null }).featCategory).toBeNull()
  })
})
