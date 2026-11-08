import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { and, eq } from 'drizzle-orm'
import * as schema from '../../server/db/schema'
import { createCharacter, createCharacterSchema } from '../../server/utils/characterCreate'
import { characterLevelUp, levelUpSchema } from '../../server/utils/characterLevelUp'
import { moineSubclasses } from '../../server/db/seeds/data/moine'
import { replayMigrations } from '../fixtures/migrations'

// Voie des quatre éléments : une discipline au niveau 3, une de plus aux niveaux 6, 11 et 17, et seulement celles dont le
// niveau de moine est atteint.

const MONK = 1
const FOUR_ELEMENTS = 10
const OWNER = 1

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any
let progressionId = 0
const discipline: Record<string, number> = {}
const D = (name: string) => discipline[name]!

const seed = moineSubclasses.find(s => s.name === 'Voie des quatre éléments')!

const createInput = (level: number, names: string[], over: Record<string, unknown> = {}) => createCharacterSchema.parse({
  name: 'Moine', hpBase: level, classId: MONK, level, speciesId: 1, subclassId: FOUR_ELEMENTS,
  abilityScores: { str: 12, dex: 15, con: 13, wis: 14 }, classSkills: [], classSavingThrows: [], backgroundSkills: [], spellIds: [],
  featurePicks: names.map(name => ({ progressionId, featureId: D(name) })),
  ...over,
})
const levelUpInput = (over: Record<string, unknown> = {}) =>
  levelUpSchema.parse({ classId: MONK, isMulticlass: false, hpDie: 5, ...over })
const pick = (name: string) => ({ progressionId, featureId: D(name) })
const featureIdsOf = async (sheetId: number): Promise<number[]> =>
  (await db.select().from(schema.characterFeatures).where(eq(schema.characterFeatures.characterSheetId, sheetId)) as Array<{ featureId: number }>).map(f => f.featureId)
const pickedIdsOf = async (sheetId: number): Promise<number[]> =>
  (await db.select().from(schema.characterChoices).where(and(
    eq(schema.characterChoices.characterSheetId, sheetId),
    eq(schema.characterChoices.progressionId, progressionId),
  )) as Array<{ selectedFeatureId: number }>).map(c => c.selectedFeatureId)

beforeAll(async () => {
  const client = createClient({ url: ':memory:' })
  await client.execute('PRAGMA foreign_keys = ON')
  await replayMigrations(client)
  db = drizzle(client, { schema, casing: 'snake_case' })

  await db.insert(schema.users).values({ id: OWNER, provider: 'discord', providerUserId: 'x', name: 'T' })
  await db.insert(schema.characterSpecies).values({ id: 1, name: 'Humain', size: 'medium', speed: 30 })
  await db.insert(schema.abilityScores).values(['str', 'dex', 'con', 'int', 'wis', 'cha'].map(id => ({ id, name: id.toUpperCase() })))
  await db.insert(schema.classes).values({ id: MONK, name: 'Moine', hitDice: '1d8', spellcastingType: 'none' })
  await db.insert(schema.subclasses).values({ id: FOUR_ELEMENTS, classId: MONK, name: 'Voie des quatre éléments' })

  const [carrier] = await db.insert(schema.features).values({ name: 'Tradition monastique', featureType: 'choice_carrier', classId: MONK, levelRequired: 3 }).returning()
  await db.insert(schema.progression).values({ featureId: carrier.id, kind: 'subclass', count: { op: 'fixed', value: 1 }, optionSource: { type: 'subclasses' }, replaceable: false })

  for (const def of seed.features) {
    const [feature] = await db.insert(schema.features).values({
      name: def.name, featureType: def.featureType, subclassId: FOUR_ELEMENTS, levelRequired: def.levelRequired,
      tag: def.tag ?? null, meta: def.meta ?? null,
    }).returning()
    if (def.tag === 'elemental_discipline') discipline[def.name] = feature.id
    if (!def.progression) continue
    const [progression] = await db.insert(schema.progression).values({
      featureId: feature.id, kind: def.progression.kind, count: def.progression.count, optionSource: def.progression.optionSource, replaceable: def.progression.replaceable ?? false,
    }).returning()
    progressionId = progression.id
  }
})

describe('création d\'un moine de la Voie des quatre éléments', () => {
  it('niveau 3 : une discipline, enregistrée et matérialisée', async () => {
    const { id } = await createCharacter(db, createInput(3, ['Frappe de cendres']), OWNER)

    expect(await featureIdsOf(id)).toContain(D('Frappe de cendres'))
    expect(await pickedIdsOf(id)).toEqual([D('Frappe de cendres')])
  })

  it('niveau 3 : pas de deuxième discipline, ni de discipline qui exige le niveau 6', async () => {
    await expect(createCharacter(db, createInput(3, ['Frappe de cendres', 'Poing de l\'air']), OWNER)).rejects.toThrow(/Trop de choix/)
    await expect(createCharacter(db, createInput(3, ['Gong du sommet']), OWNER)).rejects.toThrow(/n'est pas proposée/)
  })

  it('niveau 6 : deux disciplines, dont une qui exige le niveau 6', async () => {
    const { id } = await createCharacter(db, createInput(6, ['Frappe de cendres', 'Gong du sommet']), OWNER)
    expect((await pickedIdsOf(id)).sort()).toEqual([D('Frappe de cendres'), D('Gong du sommet')].sort())
  })

  it('niveau 17 : quatre disciplines, dont une du niveau 17', async () => {
    const names = ['Frappe de cendres', 'Gong du sommet', 'Destrier des vents', 'Souffle de l\'hiver']
    const { id } = await createCharacter(db, createInput(17, names), OWNER)
    expect(await pickedIdsOf(id)).toHaveLength(4)
  })

  it('niveau 2, ou sans la sous-classe : aucune discipline', async () => {
    await expect(createCharacter(db, createInput(2, ['Frappe de cendres']), OWNER)).rejects.toThrow(/n'est pas proposé/)
    await expect(createCharacter(db, createInput(3, ['Frappe de cendres'], { subclassId: null }), OWNER)).rejects.toThrow(/n'est pas proposé/)
  })
})

describe('montée de niveau d\'un moine de la Voie des quatre éléments', () => {
  it('5 → 6 : une discipline de plus, qui s\'ajoute à la première', async () => {
    const { id } = await createCharacter(db, createInput(5, ['Frappe de cendres']), OWNER)

    await characterLevelUp(db, id, levelUpInput({ featurePicks: [pick('Étreinte du vent du nord')] }))

    expect(await featureIdsOf(id)).toEqual(expect.arrayContaining([D('Frappe de cendres'), D('Étreinte du vent du nord')]))
  })

  it('5 → 6 : une discipline remplacée contre une nouvelle, en plus de celle due', async () => {
    const { id } = await createCharacter(db, createInput(5, ['Frappe de cendres']), OWNER)

    await characterLevelUp(db, id, levelUpInput({
      featureReplacements: [pick('Frappe de cendres')],
      featurePicks: [pick('Poing de l\'air'), pick('Gong du sommet')],
    }))

    const features = await featureIdsOf(id)
    expect(features).not.toContain(D('Frappe de cendres'))
    expect(features).toEqual(expect.arrayContaining([D('Poing de l\'air'), D('Gong du sommet')]))
  })

  it('refuse une discipline que le niveau atteint n\'ouvre pas encore', async () => {
    const { id } = await createCharacter(db, createInput(5, ['Frappe de cendres']), OWNER)
    await expect(characterLevelUp(db, id, levelUpInput({ featurePicks: [pick('Flammes du phénix')] }))).rejects.toThrow(/n'est pas proposée/)
  })
})
