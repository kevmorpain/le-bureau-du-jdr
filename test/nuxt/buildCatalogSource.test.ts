import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '../../server/db/schema'
import { buildCatalog } from '../../server/utils/catalog'
import type { Catalog } from '../../shared/rules/resolve'
import { replayMigrations } from '../fixtures/migrations'

// Gating `source` dans la résolution : le contenu d'extension ne remonte que si `extended: true`.
// Pendant de buildCatalogRuleset.test.ts pour l'axe `source`.

const WARLOCK = 1

let catalogDefault: Catalog
let catalogExtended: Catalog

beforeAll(async () => {
  const client = createClient({ url: ':memory:' })
  await client.execute('PRAGMA foreign_keys = ON')
  await replayMigrations(client)
  const orm = drizzle(client, { schema, casing: 'snake_case' })

  await orm.insert(schema.classes).values({ id: WARLOCK, name: 'Occultiste', hitDice: '1d8', spellcastingType: 'pact' })

  // Features propriétaires de progressions + leurs points de choix.
  await orm.insert(schema.features).values([
    { id: 10, name: 'Manifestations occultes', featureType: 'class_feature', classId: WARLOCK, levelRequired: 2 },
    { id: 11, name: 'Don occulte', featureType: 'class_feature', classId: WARLOCK, levelRequired: 4 },
    { id: 12, name: 'Arcanum mystique', featureType: 'class_feature', classId: WARLOCK, levelRequired: 11 },
  ])
  await orm.insert(schema.progression).values([
    { featureId: 10, kind: 'invocations', count: { op: 'fixed', value: 5 }, optionSource: { type: 'feature_group', group: 'invocation' }, replaceable: true },
    { featureId: 11, kind: 'asi_or_feat', count: { op: 'fixed', value: 1 }, optionSource: { type: 'feats' }, replaceable: false },
    { featureId: 12, kind: 'spell', count: { op: 'fixed', value: 1 }, optionSource: { type: 'spells', spellClass: 'warlock', maxLevel: 6 }, replaceable: false },
  ])

  // Pools d'options : une SOCLE ('core') + une GATÉE ('tasha') par source cachable.
  await orm.insert(schema.features).values([
    { id: 30, name: 'Invocation socle', featureType: 'eldritch_invocation', classId: WARLOCK, tag: 'invocation' },
    { id: 31, name: 'Invocation gatée', featureType: 'eldritch_invocation', classId: WARLOCK, tag: 'invocation', source: 'tasha' },
    { id: 40, name: 'Don socle', featureType: 'feat' },
    { id: 41, name: 'Don gaté', featureType: 'feat', source: 'tasha' },
  ])

  await orm.insert(schema.magicSchools).values({ id: 1, name: 'Invocation' })
  await orm.insert(schema.spells).values([
    { id: 100, name: 'Sort socle', level: 6, castingTime: '1 action', range: 0, duration: 'Instantané', schoolId: 1 },
    { id: 101, name: 'Sort gaté', level: 6, castingTime: '1 action', range: 0, duration: 'Instantané', schoolId: 1, source: 'tasha' },
  ])
  await orm.insert(schema.spellClasses).values([
    { spellId: 100, classId: WARLOCK },
    { spellId: 101, classId: WARLOCK },
  ])

  catalogDefault = await buildCatalog(orm, { classIds: [WARLOCK] })
  catalogExtended = await buildCatalog(orm, { classIds: [WARLOCK], extended: true })
})

describe('buildCatalog — gating source des options (étape 1b)', () => {
  it('feature_group (invocations) : défaut = socle seul ; extended ajoute la gatée', () => {
    const def = catalogDefault.progressions.find(p => p.kind === 'invocations')!
    expect(def.options!.map(o => o.featureId)).toEqual([30])
    const ext = catalogExtended.progressions.find(p => p.kind === 'invocations')!
    expect(ext.options!.map(o => o.featureId).sort()).toEqual([30, 31])
  })

  it('feats : défaut = don socle seul ; extended ajoute le don gaté', () => {
    const def = catalogDefault.progressions.find(p => p.kind === 'asi_or_feat')!
    expect(def.options!.map(o => o.featureId)).toEqual([40])
    const ext = catalogExtended.progressions.find(p => p.kind === 'asi_or_feat')!
    expect(ext.options!.map(o => o.featureId).sort()).toEqual([40, 41])
  })

  it('spells : défaut = sort socle seul ; extended ajoute le sort gaté (même liste de classe)', () => {
    const def = catalogDefault.progressions.find(p => p.kind === 'spell')!
    expect(def.options!.map(o => o.spellId)).toEqual([100])
    const ext = catalogExtended.progressions.find(p => p.kind === 'spell')!
    expect(ext.options!.map(o => o.spellId).sort()).toEqual([100, 101])
  })
})
