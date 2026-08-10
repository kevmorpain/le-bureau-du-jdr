import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as srcSchema from '../../server/db/schema'
import { deriveWeaponMasteries } from '../../server/utils/weaponMasteryDerivation'

// ─────────────────────────────────────────────────────────────────────────────
// C4 — dérivation des maîtrises d'armes. La fiche liste les armes choisies aux points de choix
// `weapon_mastery` (une ligne character_choices.selected_value par arme). No-op ([]) sans pick,
// ignore les autres kinds. FK OFF APRÈS migrations (patron abilityScoreDerivation) : test de
// logique de jointure, pas d'intégrité référentielle.
// ─────────────────────────────────────────────────────────────────────────────

const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations') + '/'
const NUXTHUB_UTILS = pathToFileURL(join(process.cwd(), 'node_modules', '@nuxthub', 'core', 'dist', 'db', 'lib', 'utils.mjs')).href
const SHEET = 1
const OTHER_SHEET = 2

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let orm: any

beforeAll(async () => {
  const mod = await import(/* @vite-ignore */ NUXTHUB_UTILS)
  const splitSqlQueries = mod.splitSqlQueries as (sql: string) => string[]
  const files = (await readdir(MIGRATIONS_DIR)).filter(f => f.endsWith('.sql')).sort()

  const client = createClient({ url: ':memory:' })
  for (const file of files) {
    const sql = await readFile(MIGRATIONS_DIR + file, 'utf8')
    for (const statement of splitSqlQueries(sql)) await client.execute(statement)
  }
  await client.execute('PRAGMA foreign_keys = OFF')
  orm = drizzle(client, { schema: srcSchema, casing: 'snake_case' })

  // Une progression `weapon_mastery` + une non-maîtrise (skill) à ignorer.
  await orm.insert(srcSchema.progression).values([
    { id: 10, featureId: 10, kind: 'weapon_mastery', count: { op: 'fixed', value: 2 }, optionSource: { type: 'proficient_weapons' }, replaceable: true },
    { id: 11, featureId: 11, kind: 'skill', count: { op: 'fixed', value: 1 }, optionSource: { type: 'proficient_skills' }, replaceable: false },
  ])
  await orm.insert(srcSchema.characterChoices).values([
    { characterSheetId: SHEET, progressionId: 10, selectedValue: 'épée longue' },
    { characterSheetId: SHEET, progressionId: 10, selectedValue: 'arc court' },
    { characterSheetId: SHEET, progressionId: 11, selectedValue: 'discretion' }, // skill → ignoré
  ])
})

describe('deriveWeaponMasteries', () => {
  it('liste les armes des points de choix weapon_mastery (ignore les autres kinds)', async () => {
    expect((await deriveWeaponMasteries(orm, SHEET)).sort()).toEqual(['arc court', 'épée longue'])
  })

  it('liste VIDE pour une fiche sans pick (toutes les fiches 2014)', async () => {
    expect(await deriveWeaponMasteries(orm, OTHER_SHEET)).toEqual([])
  })
})
