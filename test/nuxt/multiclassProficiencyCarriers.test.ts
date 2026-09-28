import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as srcSchema from '../../server/db/schema'
import type { Effect } from '../../server/db/schema/effects'
import { deriveClassGrants } from '../../server/utils/classProficiencyDerivation'
import { MULTICLASS_PROFICIENCY_CARRIER_NAME } from '../../server/db/seeds/data/proficiencyCarriers'
import { CLASS_PROFICIENCIES } from '../../shared/rules/classProficiencies'
import { proficiencyEffects } from '../fixtures/catalogClasses'

// Migration 0105 : crée sur les bases déployées les porteurs « Maîtrises de multiclassage » que le seed
// pose pour les bases neuves (champ `multiclass` de CLASS_PROFICIENCIES). Vérifié par la dérivation réelle.

const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations') + '/'
const NUXTHUB_UTILS = pathToFileURL(join(process.cwd(), 'node_modules', '@nuxthub', 'core', 'dist', 'db', 'lib', 'utils.mjs')).href
const MIGRATION = '0105_multiclass_proficiency_carriers.sql'

let client: Client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let orm: any
const classIdByName = new Map<string, number>()
let homonymId = 0
// Classe principale sans porteur : seul le porteur de multiclassage de la classe rejointe contribue.
let bareClassId = 0

const norm = (es: Effect[]) => es.map(e => `${e.type}:${JSON.stringify(e.value)}`).sort()

const expectedMulticlass = (className: string): Effect[] => proficiencyEffects(CLASS_PROFICIENCIES[className]!.multiclass)

async function carriersOf(classId: number): Promise<string[]> {
  const res = await client.execute({
    sql: 'SELECT name FROM features WHERE class_id = ? AND feature_type = \'multiclass_proficiency_grant\'',
    args: [classId],
  })
  return res.rows.map(r => String(r.name))
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
  orm = drizzle(client, { schema: srcSchema, casing: 'snake_case' })

  for (const className of Object.keys(CLASS_PROFICIENCIES)) {
    const cls = await orm.insert(srcSchema.classes).values({ name: className, hitDice: '1d8' }).returning().get()
    classIdByName.set(className, cls.id)
  }
  homonymId = (await orm.insert(srcSchema.classes).values({ name: 'Guerrier', hitDice: '1d10', ruleset: '5.5' }).returning().get()).id
  bareClassId = (await orm.insert(srcSchema.classes).values({ name: 'ClasseSansPorteur', hitDice: '1d6' }).returning().get()).id

  // Effets déjà en base (porteurs de départ en prod) : la migration doit les réutiliser.
  for (const effect of [
    { type: 'proficiency', value: 'light' },
    { type: 'weapon_proficiency', value: 'Épée courte' },
    { type: 'tool_proficiency', value: 'Outils de voleur' },
  ] as Effect[]) {
    await orm.insert(srcSchema.effects).values(effect)
  }

  const migration = await readFile(MIGRATIONS_DIR + MIGRATION, 'utf8')
  for (let pass = 0; pass < 2; pass++) {
    for (const statement of splitSqlQueries(migration)) await client.execute(statement)
  }
})

describe('migration 0105 — porteurs de maîtrises de multiclassage', () => {
  for (const className of Object.keys(CLASS_PROFICIENCIES)) {
    it(`${className} : la dérivation rend exactement le sous-ensemble du seed, même rejouée`, async () => {
      const classId = classIdByName.get(className)!
      const expected = expectedMulticlass(className)
      expect(await carriersOf(classId)).toEqual(expected.length ? [MULTICLASS_PROFICIENCY_CARRIER_NAME] : [])
      const grants = await deriveClassGrants(orm, [{ classId: bareClassId, isMain: true }, { classId, isMain: false }])
      expect(norm(grants.proficiencies)).toEqual(norm(expected))
    })
  }

  it('réutilise les effets existants au lieu d\'en créer de seconds', async () => {
    const res = await client.execute(
      'SELECT type, value, COUNT(*) AS c FROM effects GROUP BY type, value HAVING c > 1',
    )
    expect(res.rows).toEqual([])
  })

  it('ignore l\'homonyme 5.5', async () => {
    expect(await carriersOf(homonymId)).toEqual([])
  })
})
