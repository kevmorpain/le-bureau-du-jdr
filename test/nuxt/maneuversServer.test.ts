import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { and, eq } from 'drizzle-orm'
import * as schema from '../../server/db/schema'
import { createCharacter, createCharacterSchema } from '../../server/utils/characterCreate'
import { characterLevelUp, levelUpSchema } from '../../server/utils/characterLevelUp'
import { deriveChoiceProficiencies } from '../../server/utils/choicePicks'
import { guerrierSubclasses } from '../../server/db/seeds/data/guerrier'
import { replayMigrations } from '../fixtures/migrations'

// Maître de guerre : des manœuvres au choix, plus nombreuses aux niveaux 7, 10 et 15, remplaçables en en apprenant de nouvelles.

const FIGHTER = 1
const BATTLE_MASTER = 10
const OWNER = 1

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any
let maneuversProgressionId = 0
let discipleProgressionId = 0
const maneuver: Record<string, number> = {}
const M = (name: string) => maneuver[name]!

const seed = guerrierSubclasses.find(s => s.name === 'Maître de guerre')!

const createInput = (level: number, featurePicks: number[], over: Record<string, unknown> = {}) => createCharacterSchema.parse({
  name: 'Maître', hpBase: level, classId: FIGHTER, level, speciesId: 1, subclassId: BATTLE_MASTER,
  abilityScores: { str: 15, dex: 14, con: 13 }, classSkills: [], classSavingThrows: [], backgroundSkills: [], spellIds: [],
  featurePicks: featurePicks.map(featureId => ({ progressionId: maneuversProgressionId, featureId })),
  ...over,
})
const levelUpInput = (over: Record<string, unknown> = {}) =>
  levelUpSchema.parse({ classId: FIGHTER, isMulticlass: false, hpDie: 5, ...over })
const pick = (name: string) => ({ progressionId: maneuversProgressionId, featureId: M(name) })
const featureIdsOf = async (sheetId: number): Promise<number[]> =>
  (await db.select().from(schema.characterFeatures).where(eq(schema.characterFeatures.characterSheetId, sheetId)) as Array<{ featureId: number }>).map(f => f.featureId)
const pickedIdsOf = async (sheetId: number): Promise<number[]> =>
  (await db.select().from(schema.characterChoices).where(and(
    eq(schema.characterChoices.characterSheetId, sheetId),
    eq(schema.characterChoices.progressionId, maneuversProgressionId),
  )) as Array<{ selectedFeatureId: number }>).map(c => c.selectedFeatureId)

beforeAll(async () => {
  const client = createClient({ url: ':memory:' })
  await client.execute('PRAGMA foreign_keys = ON')
  await replayMigrations(client)
  db = drizzle(client, { schema, casing: 'snake_case' })

  await db.insert(schema.users).values({ id: OWNER, provider: 'discord', providerUserId: 'x', name: 'T' })
  await db.insert(schema.characterSpecies).values({ id: 1, name: 'Humain', size: 'medium', speed: 30 })
  await db.insert(schema.abilityScores).values(['str', 'dex', 'con', 'int', 'wis', 'cha'].map(id => ({ id, name: id.toUpperCase() })))
  await db.insert(schema.classes).values({ id: FIGHTER, name: 'Guerrier', hitDice: '1d10', spellcastingType: 'none' })
  await db.insert(schema.subclasses).values({ id: BATTLE_MASTER, classId: FIGHTER, name: 'Maître de guerre' })

  const [carrier] = await db.insert(schema.features).values({ name: 'Archétype martial', featureType: 'choice_carrier', classId: FIGHTER, levelRequired: 3 }).returning()
  await db.insert(schema.progression).values({ featureId: carrier.id, kind: 'subclass', count: { op: 'fixed', value: 1 }, optionSource: { type: 'subclasses' }, replaceable: false })

  // Les capacités du Maître de guerre, telles que le seed les déclare.
  for (const def of seed.features) {
    const [feature] = await db.insert(schema.features).values({
      name: def.name, featureType: def.featureType, subclassId: BATTLE_MASTER, levelRequired: def.levelRequired,
      tag: def.tag ?? null, meta: def.meta ?? null, maxUsesFormula: def.maxUsesFormula ?? null,
    }).returning()
    if (def.tag === 'maneuver') maneuver[def.name] = feature.id
    if (!def.progression) continue
    const [progression] = await db.insert(schema.progression).values({
      featureId: feature.id, kind: def.progression.kind, count: def.progression.count, optionSource: def.progression.optionSource, replaceable: def.progression.replaceable ?? false,
    }).returning()
    if (def.progression.kind === 'maneuvers') maneuversProgressionId = progression.id
    if (def.progression.kind === 'tool') discipleProgressionId = progression.id
  }
})

describe('création d\'un Maître de guerre', () => {
  it('niveau 3 : trois manœuvres et l\'outil de Disciple martial, enregistrés et matérialisés', async () => {
    const { id } = await createCharacter(db, createInput(3, [M('Parade'), M('Riposte'), M('Feinte')], {
      choicePicks: [{ progressionId: discipleProgressionId, value: 'Outils de forgeron' }],
    }), OWNER)

    expect(await featureIdsOf(id)).toEqual(expect.arrayContaining([M('Parade'), M('Riposte'), M('Feinte')]))
    expect(await pickedIdsOf(id)).toHaveLength(3)
    expect(await deriveChoiceProficiencies(db, id)).toEqual([{ type: 'tool_proficiency', value: 'Outils de forgeron' }])
  })

  it('niveau 7 : cinq manœuvres au plus, et jamais deux fois la même', async () => {
    const five = ['Parade', 'Riposte', 'Feinte', 'Balayage', 'Fente'].map(M)
    const { id } = await createCharacter(db, createInput(7, five), OWNER)
    expect(await pickedIdsOf(id)).toHaveLength(5)

    await expect(createCharacter(db, createInput(7, [...five, M('Regain')]), OWNER)).rejects.toThrow(/Trop de choix/)
    await expect(createCharacter(db, createInput(7, [M('Parade'), M('Parade')]), OWNER)).rejects.toThrow(/deux fois|Trop de choix/)
  })

  it('niveau 2, ou sans la sous-classe : aucune manœuvre', async () => {
    await expect(createCharacter(db, createInput(2, [M('Parade')]), OWNER)).rejects.toThrow(/n'est pas proposé/)
    await expect(createCharacter(db, createInput(3, [M('Parade')], { subclassId: null }), OWNER)).rejects.toThrow(/n'est pas proposé/)
  })

  it('refuse une option qui n\'est pas une manœuvre', async () => {
    const other = (await db.select().from(schema.features).where(eq(schema.features.name, 'Disciple martial')))[0]
    await expect(createCharacter(db, createInput(3, [other.id]), OWNER)).rejects.toThrow(/n'est pas proposée/)
  })
})

describe('montée de niveau d\'un Maître de guerre', () => {
  it('2 → 3 en choisissant la sous-classe : trois manœuvres', async () => {
    const { id } = await createCharacter(db, createInput(2, [], { subclassId: null }), OWNER)

    await characterLevelUp(db, id, levelUpInput({
      subclassId: BATTLE_MASTER,
      featurePicks: [pick('Parade'), pick('Riposte'), pick('Feinte')],
      choicePicks: [{ progressionId: discipleProgressionId, value: 'Outils de maçon' }],
    }))

    expect(await pickedIdsOf(id)).toHaveLength(3)
  })

  it('6 → 7 : deux manœuvres de plus, qui s\'ajoutent aux premières', async () => {
    const { id } = await createCharacter(db, createInput(6, [M('Parade'), M('Riposte'), M('Feinte')]), OWNER)

    await characterLevelUp(db, id, levelUpInput({ featurePicks: [pick('Balayage'), pick('Fente')] }))

    expect(await featureIdsOf(id)).toEqual(expect.arrayContaining(['Parade', 'Riposte', 'Feinte', 'Balayage', 'Fente'].map(M)))
  })

  it('6 → 7 : une manœuvre remplacée contre une nouvelle, en plus des deux dues', async () => {
    const { id } = await createCharacter(db, createInput(6, [M('Parade'), M('Riposte'), M('Feinte')]), OWNER)

    await characterLevelUp(db, id, levelUpInput({
      featureReplacements: [pick('Feinte')],
      featurePicks: [pick('Balayage'), pick('Fente'), pick('Regain')],
    }))

    const features = await featureIdsOf(id)
    expect(features).not.toContain(M('Feinte'))
    expect(features).toEqual(expect.arrayContaining(['Parade', 'Riposte', 'Balayage', 'Fente', 'Regain'].map(M)))
    expect((await pickedIdsOf(id)).sort()).toEqual(['Parade', 'Riposte', 'Balayage', 'Fente', 'Regain'].map(M).sort())
  })

  it('refuse un remplacement sans manœuvre à apprendre, sans nouvelle manœuvre, ou d\'une manœuvre non choisie ici', async () => {
    const { id } = await createCharacter(db, createInput(5, [M('Parade'), M('Riposte'), M('Feinte')]), OWNER)
    await expect(characterLevelUp(db, id, levelUpInput({ featureReplacements: [pick('Feinte')], featurePicks: [pick('Regain')] })))
      .rejects.toThrow(/n'autorise pas de remplacement/)

    const six = await createCharacter(db, createInput(6, [M('Parade'), M('Riposte'), M('Feinte')]), OWNER)
    await expect(characterLevelUp(db, six.id, levelUpInput({ featureReplacements: [pick('Feinte')] })))
      .rejects.toThrow(/exige une nouvelle option/)
    await expect(characterLevelUp(db, six.id, levelUpInput({ featureReplacements: [pick('Balayage')], featurePicks: [pick('Fente'), pick('Regain'), pick('Repousser')] })))
      .rejects.toThrow(/n'est pas sur la fiche/)

    // Tenue par la fiche sans avoir été choisie sur ce point de choix : pas remplaçable.
    await db.insert(schema.characterFeatures).values({ characterSheetId: six.id, featureId: M('Balayage'), currentUses: 0 })
    await expect(characterLevelUp(db, six.id, levelUpInput({ featureReplacements: [pick('Balayage')], featurePicks: [pick('Fente'), pick('Regain'), pick('Repousser')] })))
      .rejects.toThrow(/n'a pas été choisie/)
  })

  it('refuse de reprendre une manœuvre déjà connue', async () => {
    const { id } = await createCharacter(db, createInput(6, [M('Parade'), M('Riposte'), M('Feinte')]), OWNER)
    await expect(characterLevelUp(db, id, levelUpInput({ featurePicks: [pick('Parade'), pick('Fente')] }))).rejects.toThrow(/déjà prise/)
  })
})
