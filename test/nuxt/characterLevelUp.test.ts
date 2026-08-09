import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { eq } from 'drizzle-orm'
import * as schema from '../../server/db/schema'
import { createCharacter, createCharacterSchema } from '../../server/utils/characterCreate'
import { characterLevelUp, levelUpSchema } from '../../server/utils/characterLevelUp'
import { CharacterValidationError } from '../../server/utils/characterCreate'
import { WARLOCK_PROGRESSION_CONTRACT } from '../fixtures/warlockProgression'

// Volet 3 (5d) : montée de niveau extraite → testée contre libsql (chaîne de migrations rejouée),
// SANS auth. On crée un Occultiste via createCharacter (code testé) puis on le monte de niveau et
// on vérifie le db.batch() : bump de niveau, recalc + PURGE des emplacements de pacte, features
// débloquées, faveur de pacte, une manifestation ajoutée (applyInvocationChanges DI) + un rejet.
// FK désactivables ignorées par libsql → on seede les référentiels (comme createCharacter.test).

const MIGRATIONS_DIR = join(process.cwd(), 'server', 'db', 'migrations') + '/'
const NUXTHUB_UTILS = pathToFileURL(join(process.cwd(), 'node_modules', '@nuxthub', 'core', 'dist', 'db', 'lib', 'utils.mjs')).href
const WARLOCK = 1
const FIGHTER = 2
const FIGHTER_SUBCLASS = 10
const OWNER = 1

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any

function createInput(over: Record<string, unknown> = {}) {
  return createCharacterSchema.parse({
    name: 'Occ', maxHp: 16, classId: WARLOCK, level: 2, speciesId: 1,
    abilityScores: { cha: 16 }, classSkills: [], classSavingThrows: [], backgroundSkills: [], spellIds: [],
    ...over,
  })
}
function luInput(over: Record<string, unknown> = {}) {
  return levelUpSchema.parse({ classId: WARLOCK, isMulticlass: false, hpGained: 5, ...over })
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

  // Référentiels
  await db.insert(schema.magicSchools).values({ id: 1, name: 'Invocation' })
  await db.insert(schema.users).values({ id: OWNER, provider: 'discord', providerUserId: 'x', name: 'T' })
  await db.insert(schema.characterSpecies).values({ id: 1, name: 'Humain', size: 'medium', speed: 30 })
  await db.insert(schema.abilityScores).values(['str', 'dex', 'con', 'int', 'wis', 'cha'].map(id => ({ id, name: id.toUpperCase() })))
  // Classes + sous-classe (Guerrier, pour le rejet « sous-classe d'une autre classe »)
  await db.insert(schema.classes).values([
    { id: WARLOCK, name: 'Occultiste', hitDice: '1d8', spellcastingType: 'pact' },
    { id: FIGHTER, name: 'Guerrier', hitDice: '1d10', spellcastingType: 'none' },
  ])
  await db.insert(schema.subclasses).values({ id: FIGHTER_SUBCLASS, classId: FIGHTER, name: 'Champion' })
  // Features propriétaires + progressions (contrat 5a)
  for (let i = 0; i < WARLOCK_PROGRESSION_CONTRACT.length; i++) {
    const c = WARLOCK_PROGRESSION_CONTRACT[i]!
    await db.insert(schema.features).values({ id: 100 + i, name: c.ownerName, featureType: 'class_feature', classId: WARLOCK, levelRequired: c.ownerLevelRequired })
    await db.insert(schema.progression).values({ featureId: 100 + i, kind: c.kind, count: c.count, optionSource: c.optionSource, replaceable: c.replaceable })
  }
  // 3 manifestations (tag invocation)
  await db.insert(schema.features).values([
    { id: 401, name: 'Manif A', featureType: 'eldritch_invocation', classId: WARLOCK, levelRequired: 1, tag: 'invocation' },
    { id: 402, name: 'Manif B', featureType: 'eldritch_invocation', classId: WARLOCK, levelRequired: 1, tag: 'invocation' },
    { id: 403, name: 'Manif C', featureType: 'eldritch_invocation', classId: WARLOCK, levelRequired: 1, tag: 'invocation' },
  ])
  await db.insert(schema.spells).values({ id: 500, name: 'Appel de familier', level: 1, castingTime: '1 action', range: 0, duration: '1 h', schoolId: 1 })
  // Manifestation 5.5 (tag invocation VALIDE) — sert la garde de cohérence d'édition (Lot A) :
  // elle passe le contrôle de groupe mais est rejetée car incompatible avec une fiche 2014.
  await db.insert(schema.features).values({ id: 950, name: 'Manif 2024', featureType: 'eldritch_invocation', classId: WARLOCK, levelRequired: 1, tag: 'invocation', ruleset: '5.5' })
}, 60000)

describe('characterLevelUp — Occultiste 2 → 3 (pacte + recalc des emplacements)', () => {
  it('monte le niveau, pose le pacte, purge l\'ancien emplacement et upsert le nouveau, ajoute la feature de palier', async () => {
    const { id } = await createCharacter(db, createInput({ level: 2, invocationIds: [401, 402] }), OWNER)

    // Au niveau 2 : 2 emplacements de pacte de niveau 1
    let slots = await db.select().from(schema.characterSpellSlots).where(eq(schema.characterSpellSlots.characterSheetId, id))
    expect(slots).toHaveLength(1)
    expect(slots[0].slotLevel).toBe(1)
    expect(slots[0].total).toBe(2)

    const res = await characterLevelUp(db, id, luInput({ pactBoon: 'chain', hpGained: 6 }))
    expect(res.newLevel).toBe(3)

    const [cc] = await db.select().from(schema.characterClasses).where(eq(schema.characterClasses.characterSheetId, id))
    expect(cc.level).toBe(3)
    expect(cc.pactBoon).toBe('chain')

    // Niveau 3 : l'ancien emplacement de niveau 1 est PURGÉ, remplacé par 2 emplacements de niveau 2
    slots = await db.select().from(schema.characterSpellSlots).where(eq(schema.characterSpellSlots.characterSheetId, id))
    expect(slots).toHaveLength(1)
    expect(slots[0].slotLevel).toBe(2)
    expect(slots[0].total).toBe(2)

    // Feature de palier « Faveur de pacte » (owner niv 3, grant passif) matérialisée
    const feats = await db.select().from(schema.characterFeatures).where(eq(schema.characterFeatures.characterSheetId, id))
    expect(feats.map((f: { featureId: number }) => f.featureId)).toContain(100)

    // Familier (Pacte de la Chaîne)
    const spells = await db.select().from(schema.characterSpells).where(eq(schema.characterSpells.characterSheetId, id))
    expect(spells.some((s: { spellId: number, source: string | null }) => s.spellId === 500 && s.source === 'pact_chain')).toBe(true)
  })
})

describe('characterLevelUp — ajout d\'une manifestation (applyInvocationChanges DI)', () => {
  it('ajoute la nouvelle manifestation en feature du personnage', async () => {
    const { id } = await createCharacter(db, createInput({ level: 4, pactBoon: 'chain', invocationIds: [401, 402] }), OWNER)
    await characterLevelUp(db, id, luInput({ newInvocationIds: [403] }))

    const feats = await db.select().from(schema.characterFeatures).where(eq(schema.characterFeatures.characterSheetId, id))
    expect(feats.map((f: { featureId: number }) => f.featureId)).toContain(403)
  })
})

describe('characterLevelUp — validation serveur', () => {
  it('rejette une sous-classe n\'appartenant pas à la classe', async () => {
    const { id } = await createCharacter(db, createInput({ level: 2, invocationIds: [401, 402] }), OWNER)
    await expect(characterLevelUp(db, id, luInput({ subclassId: FIGHTER_SUBCLASS })))
      .rejects.toThrow(CharacterValidationError)
  })

  it('cohérence d\'édition (Lot A) : manifestation 5.5 sur une fiche 2014 → 422', async () => {
    const { id } = await createCharacter(db, createInput({ level: 4, pactBoon: 'chain', invocationIds: [401, 402] }), OWNER)
    await expect(characterLevelUp(db, id, luInput({ newInvocationIds: [950] })))
      .rejects.toThrow(/édition/i)
  })
})
