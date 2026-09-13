import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { and, eq } from 'drizzle-orm'
import * as srcSchema from '../../server/db/schema'

// ─────────────────────────────────────────────────────────────────────────────
// Backfill prod du choix de SOUS-CLASSE — migration 0093 (F2). `migrations.test.ts` ne rejoue la
// chaîne que sur base VIERGE (classes vides → INSERT...SELECT insère 0 ligne). Ici on teste le
// comportement sur base PEUPLÉE (= une base déployée) : après avoir seedé une classe + ses
// sous-classes, appliquer 0093 doit créer l'owner `choice_carrier` au niveau d'accès + sa
// progression `subclass` ; un 2ᵉ passage ne doit RIEN dupliquer (gardes NOT EXISTS = idempotence).
// ─────────────────────────────────────────────────────────────────────────────

const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations') + '/'
const NUXTHUB_UTILS = pathToFileURL(join(process.cwd(), 'node_modules', '@nuxthub', 'core', 'dist', 'db', 'lib', 'utils.mjs')).href
const FIGHTER = 2

let client: Client
let orm: ReturnType<typeof drizzle>
let migration0093: string[]

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

  // Base « déployée » : la classe + ses sous-classes existent (le backfill ne crée QUE le point
  // de choix). subclass_level = 3 (Guerrier, contrat CLASS_IDENTITY).
  await orm.insert(srcSchema.classes).values({ id: FIGHTER, name: 'Guerrier', hitDice: '1d10', subclassLevel: 3 })
  await orm.insert(srcSchema.subclasses).values([
    { id: 10, classId: FIGHTER, name: 'Champion' },
    { id: 11, classId: FIGHTER, name: 'Maître de guerre' },
  ])

  migration0093 = splitSqlQueries(await readFile(MIGRATIONS_DIR + '0093_subclass_choice_carriers.sql', 'utf8'))
})

async function apply0093() {
  for (const stmt of migration0093) await client.execute(stmt)
}

describe('migration 0093 — backfill du choix de sous-classe (base peuplée)', () => {
  it('crée l\'owner `choice_carrier` au niveau d\'accès + sa progression `subclass`', async () => {
    await apply0093()

    const owners = await orm.select().from(srcSchema.features)
      .where(and(eq(srcSchema.features.classId, FIGHTER), eq(srcSchema.features.name, 'Archétype martial')))
    expect(owners).toHaveLength(1)
    expect(owners[0]!.featureType).toBe('choice_carrier') // invisible (option B)
    expect(owners[0]!.levelRequired).toBe(3) // = classes.subclass_level

    const progs = await orm.select().from(srcSchema.progression).where(eq(srcSchema.progression.featureId, owners[0]!.id))
    expect(progs).toHaveLength(1)
    expect(progs[0]!.kind).toBe('subclass')
    expect(progs[0]!.optionSource).toEqual({ type: 'subclasses' })
    expect(progs[0]!.count).toEqual({ op: 'fixed', value: 1 })
  })

  it('idempotent : un 2ᵉ passage ne duplique ni l\'owner ni la progression', async () => {
    await apply0093()

    const owners = await orm.select().from(srcSchema.features)
      .where(and(eq(srcSchema.features.classId, FIGHTER), eq(srcSchema.features.name, 'Archétype martial')))
    expect(owners).toHaveLength(1)
    const progs = await orm.select().from(srcSchema.progression).where(eq(srcSchema.progression.featureId, owners[0]!.id))
    expect(progs).toHaveLength(1)
  })
})
