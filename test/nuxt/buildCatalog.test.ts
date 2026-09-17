import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as srcSchema from '../../server/db/schema'
import { buildCatalog } from '../../server/utils/catalog'
import { resolveChoices, dueChoices, type Catalog } from '../../shared/rules/resolve'
import { WARLOCK_PROGRESSION_CONTRACT } from '../fixtures/warlockProgression'

// Contrat du loader : toute la chaîne de migrations est rejouée sur libsql, on seede un Occultiste
// minimal, puis on vérifie que `buildCatalog` en tire exactement le `Catalog` que `resolveChoices`
// attend. Env `nuxt` (et non `unit`) : le loader importe `~~/server/db/schema`.

// En env `nuxt`, `import.meta.url` n'est pas un file:// → on résout depuis la racine du projet
// (process.cwd() = rootDir du projet vitest nuxt = ce worktree).
const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations') + '/'
const NUXTHUB_UTILS = pathToFileURL(join(process.cwd(), 'node_modules', '@nuxthub', 'core', 'dist', 'db', 'lib', 'utils.mjs')).href
const WARLOCK_ID = 1

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

  await orm.insert(srcSchema.classes).values({ id: WARLOCK_ID, name: 'Occultiste', hitDice: '1d8', spellcastingType: 'pact' })

  for (let i = 0; i < WARLOCK_PROGRESSION_CONTRACT.length; i++) {
    const c = WARLOCK_PROGRESSION_CONTRACT[i]!
    await orm.insert(srcSchema.features).values({ id: 10 + i, name: c.ownerName, featureType: 'class_feature', classId: WARLOCK_ID, levelRequired: c.ownerLevelRequired })
    await orm.insert(srcSchema.progression).values({ featureId: 10 + i, kind: c.kind, count: c.count, optionSource: c.optionSource, replaceable: c.replaceable })
  }

  const pacts = ['Pacte de la Chaîne', 'Pacte de la Lame', 'Pacte du Tome']
  for (let j = 0; j < pacts.length; j++)
    await orm.insert(srcSchema.features).values({ id: 20 + j, name: pacts[j]!, featureType: 'class_feature', classId: WARLOCK_ID, levelRequired: 3, tag: 'pact_boon' })

  // 2 invocations (tag invocation) : l'une avec `levelRequired`, l'autre avec un prérequis de pacte
  await orm.insert(srcSchema.features).values({ id: 30, name: 'Manifestation niv.5', featureType: 'eldritch_invocation', classId: WARLOCK_ID, levelRequired: 5, tag: 'invocation' })
  await orm.insert(srcSchema.features).values({ id: 31, name: 'Manifestation Lame', featureType: 'eldritch_invocation', classId: WARLOCK_ID, levelRequired: 1, tag: 'invocation', prerequisites: { requiredPactBoon: 'blade' } })

  await orm.insert(srcSchema.magicSchools).values({ id: 1, name: 'Invocation' })
  await orm.insert(srcSchema.spells).values({ id: 100, name: 'Sort niv.6', level: 6, castingTime: '1 action', range: 0, duration: 'Instantané', schoolId: 1 })
  await orm.insert(srcSchema.spells).values({ id: 101, name: 'Sort niv.9', level: 9, castingTime: '1 action', range: 0, duration: 'Instantané', schoolId: 1 })
  await orm.insert(srcSchema.spellClasses).values([{ spellId: 100, classId: WARLOCK_ID }, { spellId: 101, classId: WARLOCK_ID }])

  catalog = await buildCatalog(orm, { classIds: [WARLOCK_ID] })
})

describe('buildCatalog — Occultiste', () => {
  it('produit exactement les 6 progressions du contrat 5a (kind/count/optionSource/ownerLevelRequired)', () => {
    expect(catalog.progressions).toHaveLength(6)
    for (const c of WARLOCK_PROGRESSION_CONTRACT) {
      const p = catalog.progressions.find(x => x.kind === c.kind && x.ownerLevelRequired === c.ownerLevelRequired)
      expect(p, c.ownerName).toBeDefined()
      expect(p!.ownerClassId).toBe(WARLOCK_ID)
      expect(p!.count).toEqual(c.count)
      expect(p!.optionSource).toEqual(c.optionSource)
    }
  })

  it('feature_group : pacte → 3 options ; invocation → options portant levelRequired ET prérequis', () => {
    const pact = catalog.progressions.find(p => p.kind === 'pact_boon')!
    expect(pact.options).toHaveLength(3)

    const inv = catalog.progressions.find(p => p.kind === 'invocations')!
    expect(inv.options).toHaveLength(2)
    const byId = new Map(inv.options!.map(o => [o.featureId, o]))
    expect(byId.get(30)!.levelRequired).toBe(5)
    expect(byId.get(31)!.prerequisites).toEqual({ requiredPactBoon: 'blade' })
  })

  it('spells : slug « warlock » → Occultiste → sorts filtrés par maxLevel', () => {
    const arc6 = catalog.progressions.find(p => p.kind === 'spell' && p.ownerLevelRequired === 11)!
    expect(arc6.options!.map(o => o.spellId).sort((a, b) => a! - b!)).toEqual([100]) // ≤ niv. 6
    const arc9 = catalog.progressions.find(p => p.kind === 'spell' && p.ownerLevelRequired === 17)!
    expect(arc9.options!.map(o => o.spellId).sort((a, b) => a! - b!)).toEqual([100, 101]) // ≤ niv. 9
  })

  it('bout en bout loader→resolve : l\'éligibilité filtre l\'option de pacte non satisfaite', () => {
    // Occultiste niveau 11, SANS faveur de pacte choisie → l'invocation « Lame » est écartée.
    const { choices } = resolveChoices({ classLevels: { [WARLOCK_ID]: 11 } }, catalog)
    const inv = choices.find(c => c.kind === 'invocations')!
    expect(inv.count).toBe(5) // table INVOCATIONS_KNOWN au niveau 11
    expect(inv.options.map(o => o.featureId)).toEqual([30]) // 31 filtrée (prérequis pacte Lame non rempli)

    // Choix dus à L11 : pacte + manifestations + arcanum niv.6 (pas les arcanums 13/15/17).
    expect(dueChoices({ choices }).map(c => c.kind).sort()).toEqual(['invocations', 'pact_boon', 'spell'])
  })
})
