import { describe, it, expect, beforeAll } from 'vitest'
import { eq } from 'drizzle-orm'
import * as schema from '../../server/db/schema'
import { createCharacter, createCharacterSchema, CharacterValidationError } from '../../server/utils/characterCreate'
import { characterLevelUp, levelUpSchema } from '../../server/utils/characterLevelUp'
import { CLASS_SKILL_CHOICES } from '../../server/db/seeds/data/classSkills'
import { bootstrapGoldenDb, OWNER, CLASS, SPECIES } from './fixtures/goldenMaster'

// PHB 2014, maîtrises du multiclassage (https://www.aidedd.org/regles/personnalisation/multiclassage/) :
// Barde « une compétence de votre choix », Rôdeur et Roublard « une compétence choisie dans la liste
// de la classe », aucune pour les autres classes.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any
const BARD = 60

beforeAll(async () => {
  ;({ db } = await bootstrapGoldenDb())
  await db.insert(schema.classes).values({ id: BARD, name: 'Barde', hitDice: '1d8', spellcastingType: 'full', multiclassSkillCount: 1 })
  const choice = CLASS_SKILL_CHOICES.Barde!
  const [f] = await db.insert(schema.features).values({ name: 'Compétences de classe', featureType: 'choice_carrier', classId: BARD, levelRequired: 1 }).returning()
  await db.insert(schema.progression).values({ featureId: f!.id, kind: 'skill', count: { op: 'fixed', value: choice.count }, optionSource: { type: 'skills', from: choice.from }, replaceable: false })
}, 60000)

const create = (classId: number, classSkills: string[]) =>
  createCharacter(db, createCharacterSchema.parse({
    name: 'X', maxHp: 10, classId, level: 1, speciesId: SPECIES.human,
    abilityScores: { str: 14, dex: 14, con: 12, int: 10, wis: 10, cha: 14 },
    classSkills, classSavingThrows: [], backgroundSkills: [], spellIds: [],
  }), OWNER)
const createFighter = () => create(CLASS.fighter, ['athletics', 'intimidation'])
const createRogue = () => create(CLASS.rogue, ['stealth', 'perception'])

const levelUp = (id: number, over: Record<string, unknown>) => characterLevelUp(db, id, levelUpSchema.parse({
  isMulticlass: true, hpGained: 5, ...over,
}))

const skillRows = async (sheetId: number) =>
  db.select({ skillKey: schema.characterSkills.skillKey, level: schema.characterSkills.proficiencyLevel, source: schema.characterSkills.source })
    .from(schema.characterSkills)
    .where(eq(schema.characterSkills.characterSheetId, sheetId))

const classLevels = async (sheetId: number) =>
  db.select({ classId: schema.characterClasses.classId, level: schema.characterClasses.level })
    .from(schema.characterClasses)
    .where(eq(schema.characterClasses.characterSheetId, sheetId))

describe('compétences de multiclassage — schéma', () => {
  it('refuse une clé hors SKILL_KEYS', () => {
    expect(levelUpSchema.safeParse({ classId: 1, isMulticlass: true, hpGained: 5, newSkills: ['Acrobaties'] }).success).toBe(false)
  })

  it('refuse un doublon', () => {
    expect(levelUpSchema.safeParse({ classId: 1, isMulticlass: true, hpGained: 5, newSkills: ['stealth', 'stealth'] }).success).toBe(false)
  })
})

describe('compétences de multiclassage — autorité serveur', () => {
  it('Guerrier → Roublard : 1 compétence de la liste du Roublard → maîtrise de classe', async () => {
    const { id } = await createFighter()
    await levelUp(id, { classId: CLASS.rogue, newSkills: ['acrobatics'] })

    expect(await skillRows(id)).toEqual([{ skillKey: 'acrobatics', level: 'proficient', source: 'class' }])
  })

  it('Guerrier → Barde : « au choix » = n\'importe quelle compétence', async () => {
    const { id } = await createFighter()
    await levelUp(id, { classId: BARD, newSkills: ['arcana'] })

    expect(await skillRows(id)).toEqual([{ skillKey: 'arcana', level: 'proficient', source: 'class' }])
  })

  it('borne haute seulement : rejoindre le Roublard sans choisir de compétence passe', async () => {
    const { id } = await createFighter()
    await levelUp(id, { classId: CLASS.rogue })

    expect(await skillRows(id)).toEqual([])
  })

  it('Guerrier → Roublard : compétence hors de la liste du Roublard → rejet, rien d\'écrit', async () => {
    const { id } = await createFighter()
    await expect(levelUp(id, { classId: CLASS.rogue, newSkills: ['arcana'] })).rejects.toThrow(CharacterValidationError)

    expect(await skillRows(id)).toEqual([])
    expect(await classLevels(id)).toEqual([{ classId: CLASS.fighter, level: 1 }])
  })

  it('Guerrier → Roublard : 2 compétences pour 1 due → rejet', async () => {
    const { id } = await createFighter()
    await expect(levelUp(id, { classId: CLASS.rogue, newSkills: ['acrobatics', 'deception'] })).rejects.toThrow(CharacterValidationError)
  })

  it('Roublard → Guerrier : le Guerrier n\'octroie aucune compétence en multiclasse → rejet', async () => {
    const { id } = await createRogue()
    await expect(levelUp(id, { classId: CLASS.fighter, newSkills: ['athletics'] })).rejects.toThrow(CharacterValidationError)
  })

  it('niveau dans une classe déjà possédée (Roublard 1 → 2) : aucune compétence à choisir → rejet', async () => {
    const { id } = await createRogue()
    await expect(levelUp(id, { classId: CLASS.rogue, isMulticlass: false, newSkills: ['acrobatics'] })).rejects.toThrow(CharacterValidationError)

    expect(await classLevels(id)).toEqual([{ classId: CLASS.rogue, level: 1 }])
  })
})
