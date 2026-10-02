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
const DRUID = 3
const EARTH_CIRCLE = 20
const MOON_CIRCLE = 21
const OWNER = 1

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any
let terrainProgressionId = 0

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
    { id: DRUID, name: 'Druide', hitDice: '1d8', spellcastingType: 'full' },
  ])
  await db.insert(schema.subclasses).values([
    { id: FIGHTER_SUBCLASS, classId: FIGHTER, name: 'Champion' },
    { id: EARTH_CIRCLE, classId: DRUID, name: 'Cercle de la terre' },
    { id: MOON_CIRCLE, classId: DRUID, name: 'Cercle de la lune' },
  ])
  const [terrainOwner] = await db.insert(schema.features).values({ name: 'Terrain du cercle', featureType: 'choice_carrier', subclassId: EARTH_CIRCLE, levelRequired: 2 }).returning()
  const [terrainProgression] = await db.insert(schema.progression).values({
    featureId: terrainOwner.id, kind: 'terrain', count: { op: 'fixed', value: 1 }, optionSource: { type: 'enum', values: ['Forêt', 'Désert'] }, replaceable: false,
  }).returning()
  terrainProgressionId = terrainProgression.id
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
    { id: 502, name: 'Sommeil', level: 1, castingTime: '1 action', range: 0, duration: '1 min', schoolId: 1 },
    { id: 503, name: 'Hypnose', level: 1, castingTime: '1 action', range: 0, duration: '1 min', schoolId: 1 },
    { id: 600, name: 'Cercle de mort', level: 6, castingTime: '1 action', range: 0, duration: 'Instantané', schoolId: 1 },
    { id: 601, name: 'Portail', level: 9, castingTime: '1 action', range: 0, duration: 'Instantané', schoolId: 1 },
  ])
  await db.insert(schema.spellClasses).values([501, 502, 503, 600, 601].map(spellId => ({ spellId, classId: WARLOCK })))
  const [asiOwner] = await db.insert(schema.features).values({ name: 'Amélioration de caractéristiques', featureType: 'choice_carrier', classId: FIGHTER, levelRequired: 4 }).returning()
  await db.insert(schema.progression).values({ featureId: asiOwner.id, kind: 'asi_or_feat', count: { op: 'fixed', value: 1 }, optionSource: { type: 'feats' }, replaceable: false })
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

describe('characterLevelUp — autorité serveur sur les sorts (F12)', () => {
  it('refuse un sort hors de la liste de la classe', async () => {
    const { id } = await createCharacter(db, createInput({ level: 2, invocationIds: [401, 402] }), OWNER)
    await expect(characterLevelUp(db, id, luInput({ newSpellIds: [500] })))
      .rejects.toThrow(/n'est pas dans la liste de la classe Occultiste/)
  })

  it('refuse plus de sorts connus que le niveau n\'en accorde (Occultiste 2 → 3 : un seul)', async () => {
    const { id } = await createCharacter(db, createInput({ level: 2, invocationIds: [401, 402] }), OWNER)
    await expect(characterLevelUp(db, id, luInput({ newSpellIds: [501, 600] })))
      .rejects.toThrow(/Trop de sorts \(2 pour 1/)
  })

  it('arcanum : le sort de niveau 6 au niveau 11 passe, un sort de niveau 9 est refusé', async () => {
    const { id } = await createCharacter(db, createInput({ level: 10, pactBoon: 'chain', invocationIds: [401, 402] }), OWNER)
    await expect(characterLevelUp(db, id, luInput({ arcaneMysteriumSpellId: 601 })))
      .rejects.toThrow(/arcanum mystique/)
    await characterLevelUp(db, id, luInput({ arcaneMysteriumSpellId: 600 }))
  })

  it('arcanum : refusé à un niveau qui n\'en accorde pas', async () => {
    const { id } = await createCharacter(db, createInput({ level: 4, pactBoon: 'chain', invocationIds: [401, 402] }), OWNER)
    await expect(characterLevelUp(db, id, luInput({ arcaneMysteriumSpellId: 600 })))
      .rejects.toThrow(/arcanum mystique/)
  })

  it('Pacte du grimoire : les sorts mineurs exigent cette faveur', async () => {
    const { id } = await createCharacter(db, createInput({ level: 2, invocationIds: [401, 402] }), OWNER)
    await expect(characterLevelUp(db, id, luInput({ pactBoon: 'chain', pactBoonCantripIds: [500] })))
      .rejects.toThrow(/Pacte du grimoire/)
  })
})

describe('characterLevelUp — autorité serveur sur l\'amélioration de caractéristiques (F12)', () => {
  const fighterAt = (level: number) => createCharacter(db, createInput({ classId: FIGHTER, level, abilityScores: { str: 15 } }), OWNER)
  const fighterLu = (over: Record<string, unknown>) => luInput({ classId: FIGHTER, ...over })

  it('+2 sur une caractéristique au palier 4 : accepté, les six clés (zéros compris) comme le front les envoie', async () => {
    const { id } = await fighterAt(3)
    await characterLevelUp(db, id, fighterLu({ asiChoice: 'asi', asiBonuses: { str: 2, dex: 0, con: 0, int: 0, wis: 0, cha: 0 } }))
    const rows = await db.select().from(schema.characterAbilityScoreImprovements).where(eq(schema.characterAbilityScoreImprovements.characterSheetId, id))
    expect(rows.map((r: { ability: string, amount: number }) => [r.ability, r.amount])).toEqual([['str', 2]])
  })

  it('+1 sur deux caractéristiques : accepté', async () => {
    const { id } = await fighterAt(3)
    await characterLevelUp(db, id, fighterLu({ asiChoice: 'asi', asiBonuses: { str: 1, dex: 1 } }))
  })

  it('un niveau sans palier d\'ASI : refusé', async () => {
    const { id } = await fighterAt(2)
    await expect(characterLevelUp(db, id, fighterLu({ asiChoice: 'asi', asiBonuses: { str: 2 } })))
      .rejects.toThrow(/n'accorde pas d'amélioration/)
  })

  it('+2 et +1 en même temps : refusé', async () => {
    const { id } = await fighterAt(3)
    await expect(characterLevelUp(db, id, fighterLu({ asiChoice: 'asi', asiBonuses: { str: 2, dex: 1 } })))
      .rejects.toThrow(/Répartition d'ASI/)
  })

  it('une caractéristique inconnue : refusée', async () => {
    const { id } = await fighterAt(3)
    await expect(characterLevelUp(db, id, fighterLu({ asiChoice: 'asi', asiBonuses: { luck: 2 } })))
      .rejects.toThrow(/Caractéristique inconnue/)
  })

  it('un don sans don choisi, ou des bonus sans choix d\'ASI : refusés', async () => {
    const { id } = await fighterAt(3)
    await expect(characterLevelUp(db, id, fighterLu({ asiChoice: 'feat' }))).rejects.toThrow(/Aucun don/)
    await expect(characterLevelUp(db, id, fighterLu({ asiBonuses: { str: 2 } }))).rejects.toThrow(/sans choix d'ASI/)
  })
})

describe('characterLevelUp — remplacement d\'un sort connu (B11b)', () => {
  const knownIds = async (sheetId: number) =>
    (await db.select().from(schema.characterSpells).where(eq(schema.characterSpells.characterSheetId, sheetId)))
      .map((r: { spellId: number }) => r.spellId)

  it('échange un sort connu contre un autre : l\'ancien disparaît, le nouveau s\'ajoute au sort dû', async () => {
    const { id } = await createCharacter(db, createInput({ level: 2, invocationIds: [401, 402], spellIds: [501] }), OWNER)
    await characterLevelUp(db, id, luInput({ replacedSpellId: 501, newSpellIds: [502, 503] }))

    const ids = await knownIds(id)
    expect(ids).not.toContain(501)
    expect(ids).toEqual(expect.arrayContaining([502, 503]))
  })

  it('le remplaçant est compté en plus : sans lui, le remplacement est refusé', async () => {
    const { id } = await createCharacter(db, createInput({ level: 2, invocationIds: [401, 402], spellIds: [501] }), OWNER)
    await expect(characterLevelUp(db, id, luInput({ replacedSpellId: 501 })))
      .rejects.toThrow(/sans sort pour le remplacer/)
  })

  it('un troisième sort malgré le remplacement : trop de sorts', async () => {
    const { id } = await createCharacter(db, createInput({ level: 2, invocationIds: [401, 402], spellIds: [501] }), OWNER)
    await expect(characterLevelUp(db, id, luInput({ replacedSpellId: 501, newSpellIds: [502, 503, 600] })))
      .rejects.toThrow(/Trop de sorts \(3 pour 2/)
  })

  it('un sort qui n\'est pas sur la fiche, ou octroyé par autre chose que la classe : refusé', async () => {
    const { id } = await createCharacter(db, createInput({ level: 3, pactBoon: 'chain', invocationIds: [401, 402], spellIds: [501] }), OWNER)
    await expect(characterLevelUp(db, id, luInput({ replacedSpellId: 503, newSpellIds: [502] })))
      .rejects.toThrow(/n'est pas sur la fiche/)
    await expect(characterLevelUp(db, id, luInput({ replacedSpellId: 500, newSpellIds: [502] })))
      .rejects.toThrow(/n'est pas un sort connu/)
  })

  it('un refus ne retire rien de la fiche', async () => {
    const { id } = await createCharacter(db, createInput({ level: 2, invocationIds: [401, 402], spellIds: [501] }), OWNER)
    await expect(characterLevelUp(db, id, luInput({ replacedSpellId: 501 }))).rejects.toThrow(CharacterValidationError)
    expect(await knownIds(id)).toContain(501)
  })
})

describe('characterLevelUp — terrain du Cercle de la terre', () => {
  const druidAt = (level: number) => createCharacter(db, createInput({ classId: DRUID, level, abilityScores: { wis: 15 } }), OWNER)
  const druidLu = (over: Record<string, unknown>) => luInput({ classId: DRUID, ...over })
  const picksOf = async (sheetId: number) =>
    (await db.select().from(schema.characterChoices).where(eq(schema.characterChoices.characterSheetId, sheetId)))
      .filter((c: { progressionId: number }) => c.progressionId === terrainProgressionId)
      .map((c: { selectedValue: string }) => c.selectedValue)

  it('en choisissant le Cercle de la terre au niveau 2, le terrain est enregistré', async () => {
    const { id } = await druidAt(1)
    await characterLevelUp(db, id, druidLu({ subclassId: EARTH_CIRCLE, choicePicks: [{ progressionId: terrainProgressionId, value: 'Forêt' }] }))
    expect(await picksOf(id)).toEqual(['Forêt'])
  })

  it('un terrain hors de la liste : refusé', async () => {
    const { id } = await druidAt(1)
    await expect(characterLevelUp(db, id, druidLu({ subclassId: EARTH_CIRCLE, choicePicks: [{ progressionId: terrainProgressionId, value: 'Lune' }] })))
      .rejects.toThrow(/n'est pas une option/)
  })

  it('un autre cercle, ou aucun : le terrain n\'est pas proposé', async () => {
    const { id } = await druidAt(1)
    await expect(characterLevelUp(db, id, druidLu({ subclassId: MOON_CIRCLE, choicePicks: [{ progressionId: terrainProgressionId, value: 'Forêt' }] })))
      .rejects.toThrow(/n'est pas proposé/)
    await expect(characterLevelUp(db, id, druidLu({ choicePicks: [{ progressionId: terrainProgressionId, value: 'Forêt' }] })))
      .rejects.toThrow(/n'est pas proposé/)
  })

  it('plus tard, le terrain déjà choisi n\'est pas redemandé', async () => {
    const { id } = await druidAt(1)
    await characterLevelUp(db, id, druidLu({ subclassId: EARTH_CIRCLE, choicePicks: [{ progressionId: terrainProgressionId, value: 'Désert' }] }))
    await expect(characterLevelUp(db, id, druidLu({ choicePicks: [{ progressionId: terrainProgressionId, value: 'Forêt' }] })))
      .rejects.toThrow(/n'est pas proposé/)
    expect(await picksOf(id)).toEqual(['Désert'])
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
