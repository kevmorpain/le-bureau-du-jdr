import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as srcSchema from '../../server/db/schema'
import { CLASS_PROFICIENCIES } from '../../shared/rules/classProficiencies'
import { ALL_TOOLS } from '../../shared/rules/tools'

// Migration 0104 : pose sur les bases déployées les outils FIXES de classe que le seed porte pour les
// bases neuves (champ `tools` de CLASS_PROFICIENCIES → porteur « Maîtrises de la classe »).

const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations') + '/'
const NUXTHUB_UTILS = pathToFileURL(join(process.cwd(), 'node_modules', '@nuxthub', 'core', 'dist', 'db', 'lib', 'utils.mjs')).href
const MIGRATION = '0104_class_tool_proficiencies.sql'

let client: Client
const carrierIdByClass = new Map<string, number>()
let homonymCarrierId = 0

async function linkedTools(featureId: number): Promise<string[]> {
  const res = await client.execute({
    sql: 'SELECT e.value FROM feature_effects fe JOIN effects e ON e.id = fe.effect_id WHERE fe.feature_id = ? AND e.type = \'tool_proficiency\'',
    args: [featureId],
  })
  return res.rows.map(r => String(r.value)).sort()
}

beforeAll(async () => {
  const mod = await import(/* @vite-ignore */ NUXTHUB_UTILS)
  const splitSqlQueries = mod.splitSqlQueries as (sql: string) => string[]
  const files = (await readdir(MIGRATIONS_DIR)).filter(f => f.endsWith('.sql')).sort()

  client = createClient({ url: ':memory:' })
  await client.execute('PRAGMA foreign_keys = ON')
  for (const file of files) {
    const sql = await readFile(MIGRATIONS_DIR + file, 'utf8')
    for (const statement of splitSqlQueries(sql)) await client.execute(statement)
  }
  const orm = drizzle(client, { schema: srcSchema, casing: 'snake_case' })

  const carrier = (classId: number) => orm.insert(srcSchema.features)
    .values({ name: 'Maîtrises de la classe', featureType: 'proficiency_grant', classId, levelRequired: 1 })
    .returning().get()
  for (const className of Object.keys(CLASS_PROFICIENCIES)) {
    const cls = await orm.insert(srcSchema.classes).values({ name: className, hitDice: '1d8' }).returning().get()
    carrierIdByClass.set(className, (await carrier(cls.id)).id)
  }
  const homonym = await orm.insert(srcSchema.classes).values({ name: 'Roublard', hitDice: '1d8', ruleset: '5.5' }).returning().get()
  homonymCarrierId = (await carrier(homonym.id)).id

  // Effet déjà en base (porteur d'historique Criminel) : la migration doit le réutiliser.
  await orm.insert(srcSchema.effects).values({ type: 'tool_proficiency', value: 'Outils de voleur' })

  const migration = await readFile(MIGRATIONS_DIR + MIGRATION, 'utf8')
  for (let pass = 0; pass < 2; pass++) {
    for (const statement of splitSqlQueries(migration)) await client.execute(statement)
  }
})

describe('outils fixes de classe', () => {
  it('ne nomment que des outils du catalogue', () => {
    for (const [className, prof] of Object.entries(CLASS_PROFICIENCIES)) {
      for (const tool of prof.tools) expect(ALL_TOOLS, `${className} : « ${tool} »`).toContain(tool)
    }
  })
})

describe('migration 0104 — outils de classe sur les porteurs déployés', () => {
  for (const className of Object.keys(CLASS_PROFICIENCIES)) {
    it(`${className} : lie exactement les outils du seed, même rejouée`, async () => {
      const expected = CLASS_PROFICIENCIES[className]!.tools.map(tool => JSON.stringify(tool)).sort()
      expect(await linkedTools(carrierIdByClass.get(className)!)).toEqual(expected)
    })
  }

  it('réutilise l\'effet existant au lieu d\'en créer un second', async () => {
    const count = await client.execute('SELECT COUNT(*) AS c FROM effects WHERE type = \'tool_proficiency\' AND value = \'"Outils de voleur"\'')
    expect(Number(count.rows[0]!.c)).toBe(1)
  })

  it('ignore l\'homonyme 5.5', async () => {
    expect(await linkedTools(homonymCarrierId)).toEqual([])
  })
})
