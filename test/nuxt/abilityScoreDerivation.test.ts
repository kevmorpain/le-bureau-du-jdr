import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as srcSchema from '../../server/db/schema'
import { deriveAbilityScoreChoices } from '../../server/utils/abilityScoreDerivation'

// ─────────────────────────────────────────────────────────────────────────────
// C3 — dérivation de la triade d'origine 2024. La fiche transforme les `character_choices.payload`
// des points de choix `ability_scores` en une augmentation de caractéristiques (sommée). No-op
// (map vide) sans pick. FK OFF (libsql par défaut) : on teste la logique de jointure/somme, pas
// l'intégrité référentielle (couverte ailleurs) → pas besoin de seeder une fiche complète.
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
  // FK OFF APRÈS les migrations (certaines, patron recreate-table, remettent le PRAGMA ON) : test
  // de LOGIQUE (jointure character_choices→progression + somme), pas d'intégrité référentielle →
  // évite de seeder une fiche/users/features complets pour de simples picks.
  await client.execute('PRAGMA foreign_keys = OFF')
  orm = drizzle(client, { schema: srcSchema, casing: 'snake_case' })

  const abilities = { type: 'abilities' as const, from: ['str', 'dex', 'con', 'int', 'wis', 'cha'], distributions: ['2+1', '1+1+1'] }
  // Deux progressions `ability_scores` (ex. historique + un don d'ASI) + une non-triade à ignorer.
  await orm.insert(srcSchema.progression).values([
    { id: 1, featureId: 1, kind: 'ability_scores', count: { op: 'fixed', value: 1 }, optionSource: abilities, replaceable: false },
    { id: 2, featureId: 2, kind: 'ability_scores', count: { op: 'fixed', value: 1 }, optionSource: abilities, replaceable: false },
    { id: 3, featureId: 3, kind: 'skill', count: { op: 'fixed', value: 1 }, optionSource: { type: 'proficient_skills' }, replaceable: false },
  ])
  // Picks de la fiche 1 : triade principale {str:2,dex:1} + un second +1 en force → str cumulé.
  await orm.insert(srcSchema.characterChoices).values([
    { characterSheetId: SHEET, progressionId: 1, payload: { str: 2, dex: 1 } },
    { characterSheetId: SHEET, progressionId: 2, payload: { str: 1 } },
    { characterSheetId: SHEET, progressionId: 3, selectedValue: 'stealth' }, // non-triade → ignoré
  ])
})

describe('deriveAbilityScoreChoices', () => {
  it('somme les payloads de tous les points de choix ability_scores (ignore les autres kinds)', async () => {
    expect(await deriveAbilityScoreChoices(orm, SHEET)).toEqual({ str: 3, dex: 1 })
  })

  it('map VIDE pour une fiche sans pick (toutes les fiches 2014)', async () => {
    expect(await deriveAbilityScoreChoices(orm, OTHER_SHEET)).toEqual({})
  })
})
