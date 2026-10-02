import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { and, eq } from 'drizzle-orm'
import * as schema from '../../server/db/schema'
import { createCharacter, createCharacterSchema } from '../../server/utils/characterCreate'
import { characterLevelUp, levelUpSchema } from '../../server/utils/characterLevelUp'
import { CharacterValidationError } from '../../server/utils/characterCreate'
import { WARLOCK_PROGRESSION_CONTRACT } from '../fixtures/warlockProgression'
import { replayMigrations } from '../fixtures/migrations'

// Montée de niveau testée contre libsql (migrations rejouées), sans auth : bump de niveau, recalcul
// et PURGE des emplacements de pacte, features débloquées, faveur de pacte, manifestation ajoutée,
// plus un rejet.

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
  const client = createClient({ url: ':memory:' })
  await client.execute('PRAGMA foreign_keys = ON')
  await replayMigrations(client)
  db = drizzle(client, { schema, casing: 'snake_case' })

  await db.insert(schema.magicSchools).values({ id: 1, name: 'Invocation' })
  await db.insert(schema.users).values({ id: OWNER, provider: 'discord', providerUserId: 'x', name: 'T' })
  await db.insert(schema.characterSpecies).values({ id: 1, name: 'Humain', size: 'medium', speed: 30 })
  await db.insert(schema.abilityScores).values(['str', 'dex', 'con', 'int', 'wis', 'cha'].map(id => ({ id, name: id.toUpperCase() })))
  await db.insert(schema.classes).values([
    { id: WARLOCK, name: 'Occultiste', hitDice: '1d8', spellcastingType: 'pact' },
    { id: FIGHTER, name: 'Guerrier', hitDice: '1d10', spellcastingType: 'none' },
  ])
  await db.insert(schema.subclasses).values({ id: FIGHTER_SUBCLASS, classId: FIGHTER, name: 'Champion' })
  for (let i = 0; i < WARLOCK_PROGRESSION_CONTRACT.length; i++) {
    const c = WARLOCK_PROGRESSION_CONTRACT[i]!
    await db.insert(schema.features).values({ id: 100 + i, name: c.ownerName, featureType: 'class_feature', classId: WARLOCK, levelRequired: c.ownerLevelRequired })
    await db.insert(schema.progression).values({ featureId: 100 + i, kind: c.kind, count: c.count, optionSource: c.optionSource, replaceable: c.replaceable })
  }
  await db.insert(schema.features).values([
    { id: 401, name: 'Manif A', featureType: 'eldritch_invocation', classId: WARLOCK, levelRequired: 1, tag: 'invocation' },
    { id: 402, name: 'Manif B', featureType: 'eldritch_invocation', classId: WARLOCK, levelRequired: 1, tag: 'invocation' },
    { id: 403, name: 'Manif C', featureType: 'eldritch_invocation', classId: WARLOCK, levelRequired: 1, tag: 'invocation' },
  ])
  await db.insert(schema.spells).values([
    { id: 500, name: 'Appel de familier', level: 1, castingTime: '1 action', range: 0, duration: '1 h', schoolId: 1 },
    { id: 501, name: 'Maléfice', level: 1, castingTime: '1 action', range: 0, duration: '1 h', schoolId: 1 },
  ])
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

describe('characterLevelUp — classe des sorts appris (character_spells.class_id)', () => {
  const classOfSpell = async (sheetId: number, spellId: number) => {
    const [row] = await db.select().from(schema.characterSpells).where(and(
      eq(schema.characterSpells.characterSheetId, sheetId),
      eq(schema.characterSpells.spellId, spellId),
    ))
    return row?.classId
  }

  it('le sort appris au level-up porte la classe montée, et le familier de pacte aussi', async () => {
    const { id } = await createCharacter(db, createInput({ level: 2, invocationIds: [401, 402] }), OWNER)
    await characterLevelUp(db, id, luInput({ pactBoon: 'chain', newSpellIds: [501] }))

    expect(await classOfSpell(id, 501)).toBe(WARLOCK)
    expect(await classOfSpell(id, 500)).toBe(WARLOCK)
  })

  it('multiclassage : les sorts de la classe rejointe portent cette classe, pas la principale', async () => {
    const { id } = await createCharacter(db, createInput({ classId: FIGHTER, level: 3, abilityScores: { str: 15 } }), OWNER)
    await characterLevelUp(db, id, luInput({ isMulticlass: true, newSpellIds: [501] }))

    expect(await classOfSpell(id, 501)).toBe(WARLOCK)
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
