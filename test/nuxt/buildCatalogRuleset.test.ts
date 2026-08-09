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
// Filet du Lot A (durcissement du filtrage ruleset dans la RÉSOLUTION). On seede DEUX
// éditions homonymes (Occultiste '5' et '5.5') avec, pour chaque source cachable globale
// (feature_group / feats / spells), une option '5' ET une option '5.5'. On vérifie que
// `buildCatalog` (via `resolveOptions`) ne fait REMONTER que les options de l'édition du
// PROPRIÉTAIRE de la progression (features.ruleset) : jamais de fuite 5.5 dans un parcours
// 2014, et symétriquement le propriétaire 5.5 ne voit que le 5.5 (le filtre est piloté par
// l'owner, pas figé sur '5'). Même harnais que buildCatalog.test.ts (chaîne de migrations
// rejouée sur libsql en mémoire, `db` injecté).
// ─────────────────────────────────────────────────────────────────────────────

const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations') + '/'
const NUXTHUB_UTILS = pathToFileURL(join(process.cwd(), 'node_modules', '@nuxthub', 'core', 'dist', 'db', 'lib', 'utils.mjs')).href

const WARLOCK_2014 = 1
const WARLOCK_2024 = 2

let catalog2014: Catalog
let catalog2024: Catalog

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

  // Deux Occultistes HOMONYMES, une par édition.
  await orm.insert(srcSchema.classes).values([
    { id: WARLOCK_2014, name: 'Occultiste', hitDice: '1d8', spellcastingType: 'pact' },
    { id: WARLOCK_2024, name: 'Occultiste', hitDice: '1d8', spellcastingType: 'pact', ruleset: '5.5' },
  ])

  // Features PROPRIÉTAIRES de progressions — leur `ruleset` pilote le filtrage des options.
  await orm.insert(srcSchema.features).values([
    { id: 10, name: 'Manifestations occultes', featureType: 'class_feature', classId: WARLOCK_2014, levelRequired: 2 }, // '5'
    { id: 11, name: 'Don occulte', featureType: 'class_feature', classId: WARLOCK_2014, levelRequired: 4 }, // '5'
    { id: 12, name: 'Arcanum mystique', featureType: 'class_feature', classId: WARLOCK_2014, levelRequired: 11 }, // '5'
    { id: 20, name: 'Don occulte (2024)', featureType: 'class_feature', classId: WARLOCK_2024, levelRequired: 4, ruleset: '5.5' },
  ])
  await orm.insert(srcSchema.progression).values([
    { featureId: 10, kind: 'invocations', count: { op: 'fixed', value: 5 }, optionSource: { type: 'feature_group', group: 'invocation' }, replaceable: true },
    { featureId: 11, kind: 'asi_or_feat', count: { op: 'fixed', value: 1 }, optionSource: { type: 'feats' }, replaceable: false },
    { featureId: 12, kind: 'spell', count: { op: 'fixed', value: 1 }, optionSource: { type: 'spells', spellClass: 'warlock', maxLevel: 6 }, replaceable: false },
    { featureId: 20, kind: 'asi_or_feat', count: { op: 'fixed', value: 1 }, optionSource: { type: 'feats' }, replaceable: false },
  ])

  // Pools d'options : une '5' + une '5.5' pour chaque source cachable globale.
  await orm.insert(srcSchema.features).values([
    { id: 30, name: 'Manifestation 2014', featureType: 'eldritch_invocation', classId: WARLOCK_2014, tag: 'invocation' }, // '5'
    { id: 31, name: 'Manifestation 2024', featureType: 'eldritch_invocation', classId: WARLOCK_2024, tag: 'invocation', ruleset: '5.5' },
    { id: 40, name: 'Don 2014', featureType: 'feat' }, // '5'
    { id: 41, name: 'Don 2024', featureType: 'feat', ruleset: '5.5' },
  ])

  await orm.insert(srcSchema.magicSchools).values({ id: 1, name: 'Invocation' })
  await orm.insert(srcSchema.spells).values([
    { id: 100, name: 'Sort 2014', level: 6, castingTime: '1 action', range: 0, duration: 'Instantané', schoolId: 1 }, // '5'
    { id: 101, name: 'Sort 2024', level: 6, castingTime: '1 action', range: 0, duration: 'Instantané', schoolId: 1, ruleset: '5.5' },
  ])
  await orm.insert(srcSchema.spellClasses).values([
    { spellId: 100, classId: WARLOCK_2014 }, // liste 2014 (ruleset '5' par défaut)
    { spellId: 101, classId: WARLOCK_2024, ruleset: '5.5' }, // liste 2024
  ])

  catalog2014 = await buildCatalog(orm, { classIds: [WARLOCK_2014] })
  catalog2024 = await buildCatalog(orm, { classIds: [WARLOCK_2024] })
})

describe('buildCatalog — filtrage ruleset des options (Lot A)', () => {
  it('feature_group (invocations) : le propriétaire 2014 ne voit QUE l\'option 2014', () => {
    const inv = catalog2014.progressions.find(p => p.kind === 'invocations')!
    expect(inv.options!.map(o => o.featureId)).toEqual([30])
  })

  it('feats : le propriétaire 2014 ne voit QUE le don 2014', () => {
    const feats = catalog2014.progressions.find(p => p.kind === 'asi_or_feat')!
    expect(feats.options!.map(o => o.featureId)).toEqual([40])
  })

  it('spells : le propriétaire 2014 ne voit QUE le sort 2014 de la liste 2014', () => {
    const spell = catalog2014.progressions.find(p => p.kind === 'spell')!
    expect(spell.options!.map(o => o.spellId)).toEqual([100])
  })

  it('symétrie : le propriétaire 2024 ne voit QUE le don 2024 (filtre piloté par l\'owner)', () => {
    const feats = catalog2024.progressions.find(p => p.kind === 'asi_or_feat')!
    expect(feats.options!.map(o => o.featureId)).toEqual([41])
  })
})
