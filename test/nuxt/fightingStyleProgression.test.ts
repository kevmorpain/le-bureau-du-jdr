import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as srcSchema from '../../server/db/schema'
import { buildCatalog } from '../../server/utils/catalog'
import { resolveChoices, dueChoices, type Catalog } from '../../shared/rules/resolve'
import {
  fightingStyleOptionFeatures,
  fightingStyleProgression,
  FIGHTING_STYLE_LEVEL_BY_CLASS,
} from '../../server/db/seeds/data/fightingStyles'

// Point de choix de STYLE DE COMBAT. Vérifie surtout le FILTRE PAR CLASSE de `buildCatalog` sur
// `feature_group` : les styles sont dupliqués par classe, donc le Paladin ne doit PAS se voir
// proposer Archerie.

const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations') + '/'
const NUXTHUB_UTILS = pathToFileURL(join(process.cwd(), 'node_modules', '@nuxthub', 'core', 'dist', 'db', 'lib', 'utils.mjs')).href
const GUERRIER = 2
const PALADIN = 3

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

  await orm.insert(srcSchema.classes).values([
    { id: GUERRIER, name: 'Guerrier', hitDice: '1d10' },
    { id: PALADIN, name: 'Paladin', hitDice: '1d10' },
  ])

  // Owners « Style de combat » (porteurs de la progression) + leurs options taguées, par classe.
  let featureId = 100
  let progressionOwnerCount = 0
  for (const [className, classId] of [['Guerrier', GUERRIER], ['Paladin', PALADIN]] as const) {
    const ownerId = featureId++
    await orm.insert(srcSchema.features).values({
      id: ownerId,
      name: 'Style de combat',
      featureType: 'class_feature',
      classId,
      levelRequired: FIGHTING_STYLE_LEVEL_BY_CLASS[className],
    })
    await orm.insert(srcSchema.progression).values({
      featureId: ownerId,
      kind: fightingStyleProgression.kind,
      count: fightingStyleProgression.count,
      optionSource: fightingStyleProgression.optionSource,
      replaceable: fightingStyleProgression.replaceable ?? false,
    })
    progressionOwnerCount++

    for (const opt of fightingStyleOptionFeatures(className)) {
      await orm.insert(srcSchema.features).values({
        id: featureId++,
        name: opt.name,
        featureType: opt.featureType,
        classId,
        tag: opt.tag ?? null,
      })
    }
  }
  expect(progressionOwnerCount).toBe(2)

  catalog = await buildCatalog(orm, { classIds: [GUERRIER, PALADIN] })
}, 60000)

describe('progression fighting_style — buildCatalog (filtre par classe)', () => {
  it('Guerrier : 6 options ; Paladin : 4 options, SANS Archerie (filtre feature_group par classe)', () => {
    const byClass = (classId: number) =>
      catalog.progressions.find(p => p.kind === 'fighting_style' && p.ownerClassId === classId)

    const guerrier = byClass(GUERRIER)
    const paladin = byClass(PALADIN)
    if (!guerrier || !paladin) throw new Error('progression fighting_style manquante pour Guerrier ou Paladin')

    // `CatalogProgression.options` est optionnel dans le type (absent pour proficient_skills) ; pour
    // feature_group buildCatalog le renseigne toujours → `?? []` narrows sans masquer un vrai bug.
    const guerrierOptions = guerrier.options ?? []
    const paladinOptions = paladin.options ?? []
    expect(guerrierOptions).toHaveLength(6)
    expect(paladinOptions).toHaveLength(4)

    // Les options d'une classe sont EXCLUSIVEMENT ses propres features (aucun recouvrement).
    const guerrierIds = new Set(guerrierOptions.map(o => o.featureId))
    const paladinIds = new Set(paladinOptions.map(o => o.featureId))
    for (const id of paladinIds) expect(guerrierIds.has(id), `option Paladin ${id} fuit du Guerrier`).toBe(false)
  })
})

describe('progression fighting_style — resolveChoices / dueChoices', () => {
  it('Guerrier : dû dès le niveau 1', () => {
    const { choices } = resolveChoices({ classLevels: { [GUERRIER]: 1 } }, catalog)
    const fs = choices.find(c => c.kind === 'fighting_style')
    expect(fs, 'choix fighting_style Guerrier niv 1').toBeDefined()
    expect(fs!.count).toBe(1)
    expect(fs!.options).toHaveLength(6)
    expect(dueChoices({ choices }).map(c => c.kind)).toContain('fighting_style')
  })

  it('Paladin : PAS dû au niveau 1, dû au niveau 2', () => {
    const at1 = resolveChoices({ classLevels: { [PALADIN]: 1 } }, catalog)
    expect(dueChoices(at1).map(c => c.kind)).not.toContain('fighting_style')

    const at2 = resolveChoices({ classLevels: { [PALADIN]: 2 } }, catalog)
    const fs = at2.choices.find(c => c.kind === 'fighting_style')
    expect(fs, 'choix fighting_style Paladin niv 2').toBeDefined()
    expect(fs!.options).toHaveLength(4)
    expect(dueChoices(at2).map(c => c.kind)).toContain('fighting_style')
  })
})
