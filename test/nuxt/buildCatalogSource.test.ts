import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as srcSchema from '../../server/db/schema'
import { buildCatalog } from '../../server/utils/catalog'
import type { Catalog } from '../../shared/rules/resolve'

// ─────────────────────────────────────────────────────────────────────────────
// Gating `source` dans la RÉSOLUTION (étape 1b). Pendant de buildCatalogRuleset.test.ts pour
// l'axe `source` : pour chaque source cachable (feature_group / feats / spells) on seede une
// option socle ('core') ET une option d'extension ('tasha'), et on vérifie que `buildCatalog`
// n'inclut le contenu gaté QUE si `extended: true`. Défaut = socle seul. Les branches
// subclasses / lineages utilisent le même pattern `and(eq(owner), source filter)` (couvert par
// les tests de loaders). Même harnais (chaîne de migrations rejouée sur libsql, `db` injecté).
// ─────────────────────────────────────────────────────────────────────────────

const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations') + '/'
const NUXTHUB_UTILS = pathToFileURL(join(process.cwd(), 'node_modules', '@nuxthub', 'core', 'dist', 'db', 'lib', 'utils.mjs')).href

const WARLOCK = 1

let catalogDefault: Catalog
let catalogExtended: Catalog

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
  const orm = drizzle(client, { schema: srcSchema, casing: 'snake_case' })

  await orm.insert(srcSchema.classes).values({ id: WARLOCK, name: 'Occultiste', hitDice: '1d8', spellcastingType: 'pact' })

  // Features propriétaires de progressions + leurs points de choix.
  await orm.insert(srcSchema.features).values([
    { id: 10, name: 'Manifestations occultes', featureType: 'class_feature', classId: WARLOCK, levelRequired: 2 },
    { id: 11, name: 'Don occulte', featureType: 'class_feature', classId: WARLOCK, levelRequired: 4 },
    { id: 12, name: 'Arcanum mystique', featureType: 'class_feature', classId: WARLOCK, levelRequired: 11 },
  ])
  await orm.insert(srcSchema.progression).values([
    { featureId: 10, kind: 'invocations', count: { op: 'fixed', value: 5 }, optionSource: { type: 'feature_group', group: 'invocation' }, replaceable: true },
    { featureId: 11, kind: 'asi_or_feat', count: { op: 'fixed', value: 1 }, optionSource: { type: 'feats' }, replaceable: false },
    { featureId: 12, kind: 'spell', count: { op: 'fixed', value: 1 }, optionSource: { type: 'spells', spellClass: 'warlock', maxLevel: 6 }, replaceable: false },
  ])

  // Pools d'options : une SOCLE ('core') + une GATÉE ('tasha') par source cachable.
  await orm.insert(srcSchema.features).values([
    { id: 30, name: 'Invocation socle', featureType: 'eldritch_invocation', classId: WARLOCK, tag: 'invocation' },
    { id: 31, name: 'Invocation gatée', featureType: 'eldritch_invocation', classId: WARLOCK, tag: 'invocation', source: 'tasha' },
    { id: 40, name: 'Don socle', featureType: 'feat' },
    { id: 41, name: 'Don gaté', featureType: 'feat', source: 'tasha' },
  ])

  await orm.insert(srcSchema.magicSchools).values({ id: 1, name: 'Invocation' })
  await orm.insert(srcSchema.spells).values([
    { id: 100, name: 'Sort socle', level: 6, castingTime: '1 action', range: 0, duration: 'Instantané', schoolId: 1 },
    { id: 101, name: 'Sort gaté', level: 6, castingTime: '1 action', range: 0, duration: 'Instantané', schoolId: 1, source: 'tasha' },
  ])
  await orm.insert(srcSchema.spellClasses).values([
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
