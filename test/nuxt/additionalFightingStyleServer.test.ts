import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { eq } from 'drizzle-orm'
import * as schema from '../../server/db/schema'
import { createCharacter, createCharacterSchema } from '../../server/utils/characterCreate'
import { characterLevelUp, levelUpSchema } from '../../server/utils/characterLevelUp'
import { guerrierSubclasses } from '../../server/db/seeds/data/guerrier'
import { fightingStyleProgression } from '../../server/db/seeds/data/fightingStyles'
import { replayMigrations } from '../fixtures/migrations'

// Champion niveau 10 : une deuxième option de style de combat, différente de la première.

const FIGHTER = 1
const CHAMPION = 10
const MASTER = 11
const OWNER = 1

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any
let additionalProgressionId = 0
const style = { archery: 0, defense: 0, dueling: 0 }

const createInput = (level: number, over: Record<string, unknown> = {}) => createCharacterSchema.parse({
  name: 'Champion', hpBase: level, classId: FIGHTER, level, speciesId: 1, subclassId: CHAMPION, fightingStyle: 'Duel',
  abilityScores: { str: 15, dex: 14, con: 13 }, classSkills: [], classSavingThrows: [], backgroundSkills: [], spellIds: [],
  ...over,
})
const levelUpInput = (over: Record<string, unknown> = {}) =>
  levelUpSchema.parse({ classId: FIGHTER, isMulticlass: false, hpDie: 5, ...over })
const pick = (featureId: number) => ({ progressionId: additionalProgressionId, featureId })
const featureIdsOf = async (sheetId: number): Promise<number[]> =>
  (await db.select().from(schema.characterFeatures).where(eq(schema.characterFeatures.characterSheetId, sheetId)) as Array<{ featureId: number }>).map(f => f.featureId)

beforeAll(async () => {
  const client = createClient({ url: ':memory:' })
  await client.execute('PRAGMA foreign_keys = ON')
  await replayMigrations(client)
  db = drizzle(client, { schema, casing: 'snake_case' })

  await db.insert(schema.users).values({ id: OWNER, provider: 'discord', providerUserId: 'x', name: 'T' })
  await db.insert(schema.characterSpecies).values({ id: 1, name: 'Humain', size: 'medium', speed: 30 })
  await db.insert(schema.abilityScores).values(['str', 'dex', 'con', 'int', 'wis', 'cha'].map(id => ({ id, name: id.toUpperCase() })))
  await db.insert(schema.classes).values({ id: FIGHTER, name: 'Guerrier', hitDice: '1d10', spellcastingType: 'none' })
  await db.insert(schema.subclasses).values([
    { id: CHAMPION, classId: FIGHTER, name: 'Champion' },
    { id: MASTER, classId: FIGHTER, name: 'Maître de guerre' },
  ])

  // Le style de combat de la classe (porteur invisible + options), puis la capacité du Champion, comme le seed les déclare.
  const [carrier] = await db.insert(schema.features).values({ name: 'Style de combat', featureType: 'choice_carrier', classId: FIGHTER, levelRequired: 1 }).returning()
  await db.insert(schema.progression).values({
    featureId: carrier.id, kind: fightingStyleProgression.kind, count: fightingStyleProgression.count, optionSource: fightingStyleProgression.optionSource, replaceable: false,
  })
  for (const [key, name] of [['archery', 'Archerie'], ['defense', 'Défense'], ['dueling', 'Duel']] as const) {
    const [option] = await db.insert(schema.features).values({ name, featureType: 'fighting_style', tag: 'fighting_style', classId: FIGHTER, levelRequired: 1 }).returning()
    style[key] = option.id
  }
  const championDef = guerrierSubclasses.find(s => s.name === 'Champion')!.features.find(f => f.name === 'Style de combat supplémentaire')!
  const [extra] = await db.insert(schema.features).values({
    name: championDef.name, featureType: 'subclass_feature', subclassId: CHAMPION, levelRequired: championDef.levelRequired,
  }).returning()
  const [progression] = await db.insert(schema.progression).values({
    featureId: extra.id, kind: championDef.progression!.kind, count: championDef.progression!.count, optionSource: championDef.progression!.optionSource, replaceable: false,
  }).returning()
  additionalProgressionId = progression.id
})

describe('création d\'un Champion niveau 10', () => {
  it('enregistre le deuxième style, qui s\'ajoute au premier sur la fiche', async () => {
    const { id } = await createCharacter(db, createInput(10, { featurePicks: [pick(style.defense)] }), OWNER)

    const features = await featureIdsOf(id)
    expect(features).toContain(style.dueling)
    expect(features).toContain(style.defense)
    const choices = await db.select().from(schema.characterChoices).where(eq(schema.characterChoices.characterSheetId, id))
    expect(choices.some((c: { progressionId: number, selectedFeatureId: number | null }) => c.progressionId === additionalProgressionId && c.selectedFeatureId === style.defense)).toBe(true)
  })

  it('refuse le premier style une seconde fois, un excédent et un choix que la fiche ne doit pas', async () => {
    await expect(createCharacter(db, createInput(10, { featurePicks: [pick(style.dueling)] }), OWNER)).rejects.toThrow(/déjà prise/)
    await expect(createCharacter(db, createInput(10, { featurePicks: [pick(style.defense), pick(style.archery)] }), OWNER)).rejects.toThrow(/Trop de choix/)
    await expect(createCharacter(db, createInput(9, { featurePicks: [pick(style.defense)] }), OWNER)).rejects.toThrow(/n'est pas proposé/)
    await expect(createCharacter(db, createInput(10, { subclassId: MASTER, featurePicks: [pick(style.defense)] }), OWNER)).rejects.toThrow(/n'est pas proposé/)
  })
})

describe('montée au niveau 10 d\'un Champion', () => {
  it('propose le deuxième style et l\'enregistre', async () => {
    const { id } = await createCharacter(db, createInput(9), OWNER)

    await characterLevelUp(db, id, levelUpInput({ featurePicks: [pick(style.archery)] }))

    expect(await featureIdsOf(id)).toEqual(expect.arrayContaining([style.dueling, style.archery]))
  })

  it('refuse le style déjà pris, et tout choix à un autre niveau', async () => {
    const early = await createCharacter(db, createInput(9), OWNER)
    await expect(characterLevelUp(db, early.id, levelUpInput({ featurePicks: [pick(style.dueling)] }))).rejects.toThrow(/déjà prise/)

    const late = await createCharacter(db, createInput(10, { featurePicks: [pick(style.defense)] }), OWNER)
    await expect(characterLevelUp(db, late.id, levelUpInput({ featurePicks: [pick(style.archery)] }))).rejects.toThrow(/n'est pas proposé/)
  })
})
