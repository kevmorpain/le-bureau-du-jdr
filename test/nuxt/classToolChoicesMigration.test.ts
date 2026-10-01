import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as srcSchema from '../../server/db/schema'
import { CLASS_PROFICIENCIES, type ProficiencySet } from '../../shared/rules/classProficiencies'
import { CLASS_PROFICIENCY_CARRIER_NAME, MULTICLASS_PROFICIENCY_CARRIER_NAME } from '../../server/db/seeds/data/proficiencyCarriers'

// Migration 0109 : pose sur les porteurs déployés les outils AU CHOIX de classe que le seed déclare
// (`toolChoice`), sur le porteur de départ comme sur celui de multiclassage.

const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations') + '/'
const NUXTHUB_UTILS = pathToFileURL(join(process.cwd(), 'node_modules', '@nuxthub', 'core', 'dist', 'db', 'lib', 'utils.mjs')).href
const MIGRATION = '0109_class_tool_choices.sql'

let client: Client
const carriers = new Map<string, { start: number, multiclass: number }>()
let homonymCarrierId = 0

async function toolChoiceOf(featureId: number) {
  const res = await client.execute({ sql: 'SELECT count, option_source FROM progression WHERE feature_id = ? AND kind = \'tool\'', args: [featureId] })
  return res.rows.map(r => ({ count: JSON.parse(String(r.count)).value, from: JSON.parse(String(r.option_source)).from }))
}
const expected = (set: ProficiencySet) => set.toolChoice ? [{ count: set.toolChoice.count, from: set.toolChoice.from }] : []

beforeAll(async () => {
  const mod = await import(/* @vite-ignore */ NUXTHUB_UTILS)
  const splitSqlQueries = mod.splitSqlQueries as (sql: string) => string[]
  client = createClient({ url: ':memory:' })
  for (const file of (await readdir(MIGRATIONS_DIR)).filter(f => f.endsWith('.sql')).sort()) {
    for (const statement of splitSqlQueries(await readFile(MIGRATIONS_DIR + file, 'utf8'))) await client.execute(statement)
  }
  const orm = drizzle(client, { schema: srcSchema, casing: 'snake_case' })

  const carrier = (classId: number, name: string, featureType: 'proficiency_grant' | 'multiclass_proficiency_grant') =>
    orm.insert(srcSchema.features).values({ name, featureType, classId, levelRequired: 1 }).returning().get()
  for (const className of Object.keys(CLASS_PROFICIENCIES)) {
    const cls = await orm.insert(srcSchema.classes).values({ name: className, hitDice: '1d8' }).returning().get()
    carriers.set(className, {
      start: (await carrier(cls.id, CLASS_PROFICIENCY_CARRIER_NAME, 'proficiency_grant')).id,
      multiclass: (await carrier(cls.id, MULTICLASS_PROFICIENCY_CARRIER_NAME, 'multiclass_proficiency_grant')).id,
    })
  }
  const homonym = await orm.insert(srcSchema.classes).values({ name: 'Barde', hitDice: '1d8', ruleset: '5.5' }).returning().get()
  homonymCarrierId = (await carrier(homonym.id, CLASS_PROFICIENCY_CARRIER_NAME, 'proficiency_grant')).id

  const migration = await readFile(MIGRATIONS_DIR + MIGRATION, 'utf8')
  for (let pass = 0; pass < 2; pass++) {
    for (const statement of splitSqlQueries(migration)) await client.execute(statement)
  }
})

describe('migration 0109 — outils au choix de classe', () => {
  for (const [className, prof] of Object.entries(CLASS_PROFICIENCIES)) {
    it(`${className} : le choix d'outil du seed sur chaque porteur, même rejouée`, async () => {
      const ids = carriers.get(className)!
      expect(await toolChoiceOf(ids.start)).toEqual(expected(prof))
      expect(await toolChoiceOf(ids.multiclass)).toEqual(expected(prof.multiclass))
    })
  }

  it('ignore l\'homonyme 5.5', async () => {
    expect(await toolChoiceOf(homonymCarrierId)).toEqual([])
  })
})
