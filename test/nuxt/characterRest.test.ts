import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { and, eq } from 'drizzle-orm'
import * as schema from '../../server/db/schema'
import { createCharacter, createCharacterSchema } from '../../server/utils/characterCreate'
import { characterRest } from '../../server/utils/characterRest'
import { WARLOCK_PROGRESSION_CONTRACT } from '../fixtures/warlockProgression'

// Volet 4 (5d) : repos extrait → testé contre libsql (migrations rejouées), sans auth. On vérifie
// la recharge (features + emplacements) ET la préservation de la dépendance d'ORDRE sur currentHp
// (repos long puis soin par dés de vie).

const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations') + '/'
const NUXTHUB_UTILS = pathToFileURL(join(process.cwd(), 'node_modules', '@nuxthub', 'core', 'dist', 'db', 'lib', 'utils.mjs')).href
const WARLOCK = 1
const OWNER = 1
const RECHARGE_FEATURE = 210 // feature passive rechargeable (short_rest)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any

function newWarlock(over: Record<string, unknown> = {}) {
  return createCharacterSchema.parse({
    name: 'Occ', maxHp: 24, classId: WARLOCK, level: 3, speciesId: 1, pactBoon: 'chain',
    abilityScores: { cha: 16 }, classSkills: [], classSavingThrows: [], backgroundSkills: [], spellIds: [],
    invocationIds: [401, 402], ...over,
  })
}

async function create() {
  const { id } = await createCharacter(db, newWarlock(), OWNER)
  return id
}

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
  db = drizzle(client, { schema, casing: 'snake_case' })

  await db.insert(schema.magicSchools).values({ id: 1, name: 'Invocation' })
  await db.insert(schema.users).values({ id: OWNER, provider: 'discord', providerUserId: 'x', name: 'T' })
  await db.insert(schema.characterSpecies).values({ id: 1, name: 'Humain', size: 'medium', speed: 30 })
  await db.insert(schema.abilityScores).values(['str', 'dex', 'con', 'int', 'wis', 'cha'].map(id => ({ id, name: id.toUpperCase() })))
  await db.insert(schema.classes).values({ id: WARLOCK, name: 'Occultiste', hitDice: '1d8', spellcastingType: 'pact' })
  for (let i = 0; i < WARLOCK_PROGRESSION_CONTRACT.length; i++) {
    const c = WARLOCK_PROGRESSION_CONTRACT[i]!
    await db.insert(schema.features).values({ id: 100 + i, name: c.ownerName, featureType: 'class_feature', classId: WARLOCK, levelRequired: c.ownerLevelRequired })
    await db.insert(schema.progression).values({ featureId: 100 + i, kind: c.kind, count: c.count, optionSource: c.optionSource, replaceable: c.replaceable })
  }
  // Feature passive RECHARGEABLE (repos court) → matérialisée d'office par createCharacter
  await db.insert(schema.features).values({ id: RECHARGE_FEATURE, name: 'Récup. arcanique', featureType: 'class_feature', classId: WARLOCK, levelRequired: 1, rechargeType: 'short_rest' })
  await db.insert(schema.features).values([
    { id: 401, name: 'Manif A', featureType: 'eldritch_invocation', classId: WARLOCK, levelRequired: 1, tag: 'invocation' },
    { id: 402, name: 'Manif B', featureType: 'eldritch_invocation', classId: WARLOCK, levelRequired: 1, tag: 'invocation' },
  ])
  await db.insert(schema.spells).values({ id: 500, name: 'Appel de familier', level: 1, castingTime: '1 action', range: 0, duration: '1 h', schoolId: 1 })
}, 60000)

describe('characterRest — repos court', () => {
  it('recharge la feature (short_rest) et les emplacements de pacte', async () => {
    const id = await create()
    await db.update(schema.characterFeatures).set({ currentUses: 1 }).where(and(eq(schema.characterFeatures.characterSheetId, id), eq(schema.characterFeatures.featureId, RECHARGE_FEATURE)))
    await db.update(schema.characterSpellSlots).set({ used: 2 }).where(eq(schema.characterSpellSlots.characterSheetId, id))

    await characterRest(db, id, { type: 'short', hitDiceSpent: [] })

    const [feat] = await db.select().from(schema.characterFeatures).where(and(eq(schema.characterFeatures.characterSheetId, id), eq(schema.characterFeatures.featureId, RECHARGE_FEATURE)))
    expect(feat.currentUses).toBe(0)
    const slots = await db.select().from(schema.characterSpellSlots).where(eq(schema.characterSpellSlots.characterSheetId, id))
    expect(slots.every((s: { used: number }) => s.used === 0)).toBe(true)
  })
})

describe('characterRest — repos long', () => {
  it('restaure les PV au max et réinitialise les emplacements', async () => {
    const id = await create()
    await db.update(schema.characterSheets).set({ currentHp: 5 }).where(eq(schema.characterSheets.id, id))
    await db.update(schema.characterSpellSlots).set({ used: 2 }).where(eq(schema.characterSpellSlots.characterSheetId, id))

    await characterRest(db, id, { type: 'long', hitDiceSpent: [] })

    const [sheet] = await db.select().from(schema.characterSheets).where(eq(schema.characterSheets.id, id))
    expect(sheet.currentHp).toBe(24) // maxHp
    const slots = await db.select().from(schema.characterSpellSlots).where(eq(schema.characterSpellSlots.characterSheetId, id))
    expect(slots.every((s: { used: number }) => s.used === 0)).toBe(true)
  })

  it('PRÉSERVE la dépendance d\'ordre : long + dés de vie → min(currentHp lu + soin, maxHp), pas maxHp', async () => {
    const id = await create()
    await db.update(schema.characterSheets).set({ currentHp: 5 }).where(eq(schema.characterSheets.id, id))

    // Repos long (mettrait currentHp=24) MAIS avec 3 PV de dés de vie → le soin écrase à min(5+3,24)=8.
    await characterRest(db, id, { type: 'long', hitDiceSpent: [{ die: 'd8', count: 1, healAmount: 3 }] })

    const [sheet] = await db.select().from(schema.characterSheets).where(eq(schema.characterSheets.id, id))
    expect(sheet.currentHp).toBe(8) // comportement historique préservé (le soin par dés de vie l'emporte)
  })
})
