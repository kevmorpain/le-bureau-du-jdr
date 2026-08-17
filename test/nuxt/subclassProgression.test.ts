import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as srcSchema from '../../server/db/schema'
import { buildCatalog } from '../../server/utils/catalog'
import { resolveChoices, dueChoices, type Catalog } from '../../shared/rules/resolve'
import { subclassChoiceFeature } from '../../server/db/seeds/data/subclassChoice'

// ─────────────────────────────────────────────────────────────────────────────
// Mécanisme du point de choix de SOUS-CLASSE (F2). Ferme la boucle données→catalogue→résolution
// pour la progression `kind:'subclass'` — jamais exercée jusqu'ici (seuls pacte/invocations/arcanum
// et lignée l'étaient). On seede une classe + 2 sous-classes + la feature owner portant EXACTEMENT
// la progression produite par `subclassChoiceFeature` (source du seed), puis on vérifie que
// `buildCatalog` en tire un point de choix `subclass` dont `optionSource:{subclasses}` se résout aux
// 2 sous-classes, et que `resolveChoices`/`dueChoices` le rendent DÛ au niveau d'accès — mais pas avant.
//
// Env `nuxt` (comme buildCatalog.test) : le loader importe `~~/server/db/schema`.
// ─────────────────────────────────────────────────────────────────────────────

const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations') + '/'
const NUXTHUB_UTILS = pathToFileURL(join(process.cwd(), 'node_modules', '@nuxthub', 'core', 'dist', 'db', 'lib', 'utils.mjs')).href
const FIGHTER = 2
const SUBCLASS_LEVEL = 3 // Guerrier — niveau d'accès à la sous-classe (contrat CLASS_IDENTITY)

let catalog: Catalog

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

  await orm.insert(srcSchema.classes).values({ id: FIGHTER, name: 'Guerrier', hitDice: '1d10', subclassLevel: SUBCLASS_LEVEL })
  await orm.insert(srcSchema.subclasses).values([
    { id: 10, classId: FIGHTER, name: 'Champion' },
    { id: 11, classId: FIGHTER, name: 'Maître de guerre' },
  ])

  // Feature owner du choix de sous-classe, portant EXACTEMENT la progression du seed (helper F2).
  const owner = subclassChoiceFeature('Guerrier')
  await orm.insert(srcSchema.features).values({ id: 50, name: owner.name, featureType: 'class_feature', classId: FIGHTER, levelRequired: owner.levelRequired })
  await orm.insert(srcSchema.progression).values({
    featureId: 50,
    kind: owner.progression!.kind,
    count: owner.progression!.count,
    optionSource: owner.progression!.optionSource,
    replaceable: owner.progression!.replaceable ?? false,
  })

  catalog = await buildCatalog(orm, { classIds: [FIGHTER] })
}, 60000)

describe('progression subclass — buildCatalog', () => {
  it('produit un point de choix `subclass` (fixed 1) dont {subclasses} se résout aux 2 sous-classes', () => {
    const sub = catalog.progressions.find(p => p.kind === 'subclass')
    expect(sub, 'progression subclass').toBeDefined()
    expect(sub!.ownerClassId).toBe(FIGHTER)
    expect(sub!.ownerLevelRequired).toBe(SUBCLASS_LEVEL)
    expect(sub!.count).toEqual({ op: 'fixed', value: 1 })
    expect(sub!.options!.map(o => o.subclassId).sort((a, b) => a! - b!)).toEqual([10, 11])
  })
})

describe('progression subclass — resolveChoices / dueChoices', () => {
  it('dû AU niveau d\'accès (3) : un choix subclass avec les 2 options', () => {
    const { choices } = resolveChoices({ classLevels: { [FIGHTER]: SUBCLASS_LEVEL } }, catalog)
    const sub = choices.find(c => c.kind === 'subclass')
    expect(sub, 'choix subclass au niv 3').toBeDefined()
    expect(sub!.count).toBe(1)
    expect(sub!.options.map(o => o.subclassId).sort((a, b) => a! - b!)).toEqual([10, 11])
    expect(dueChoices({ choices }).map(c => c.kind)).toContain('subclass')
  })

  it('PAS dû sous le niveau d\'accès (niv 2) : aucun choix subclass exigé', () => {
    const { choices } = resolveChoices({ classLevels: { [FIGHTER]: 2 } }, catalog)
    expect(dueChoices({ choices }).map(c => c.kind)).not.toContain('subclass')
  })
})
