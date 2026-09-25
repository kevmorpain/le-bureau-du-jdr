import { describe, it, expect, beforeAll } from 'vitest'
import { eq } from 'drizzle-orm'
import * as schema from '../../server/db/schema'
import { createCharacter, createCharacterSchema, CharacterValidationError } from '../../server/utils/characterCreate'
import { characterLevelUp, levelUpSchema } from '../../server/utils/characterLevelUp'
import { bootstrapGoldenDb, OWNER, CLASS, SPECIES, FEATURE } from './fixtures/goldenMaster'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any

beforeAll(async () => {
  ;({ db } = await bootstrapGoldenDb())
}, 60000)

const createRogue = (level: number, over: Record<string, unknown> = {}) =>
  createCharacter(db, createCharacterSchema.parse({
    name: 'Sly', maxHp: 9, classId: CLASS.rogue, level, speciesId: SPECIES.human,
    abilityScores: { str: 10, dex: 16, con: 12, int: 13, wis: 11, cha: 14 },
    classSkills: ['stealth', 'perception'], classSavingThrows: ['dex', 'int'], backgroundSkills: ['insight', 'deception'], spellIds: [],
    ...over,
  }), OWNER)

const expertiseChoices = async (sheetId: number): Promise<string[]> => {
  const rows = await db.select({ selectedValue: schema.characterChoices.selectedValue, kind: schema.progression.kind })
    .from(schema.characterChoices)
    .innerJoin(schema.progression, eq(schema.progression.id, schema.characterChoices.progressionId))
    .where(eq(schema.characterChoices.characterSheetId, sheetId))
  return rows.filter((r: { kind: string }) => r.kind === 'expertise').map((r: { selectedValue: string }) => r.selectedValue).sort()
}

const expertSkills = async (sheetId: number): Promise<string[]> => {
  const rows = await db.select({ skillKey: schema.characterSkills.skillKey, level: schema.characterSkills.proficiencyLevel })
    .from(schema.characterSkills)
    .where(eq(schema.characterSkills.characterSheetId, sheetId))
  return rows.filter((r: { level: string }) => r.level === 'expert').map((r: { skillKey: string }) => r.skillKey).sort()
}

const materializedFeatureIds = async (sheetId: number): Promise<number[]> => {
  const rows = await db.select({ featureId: schema.characterFeatures.featureId })
    .from(schema.characterFeatures)
    .where(eq(schema.characterFeatures.characterSheetId, sheetId))
  return rows.map((r: { featureId: number }) => r.featureId)
}

describe('expertise — autorité serveur', () => {
  it('création Roublard niv 1 : 2 expertises → character_choices + compétences \'expert\' + feature « Expertise » matérialisée', async () => {
    const { id } = await createRogue(1, { expertiseSkills: ['stealth', 'perception'] })

    expect(await expertiseChoices(id)).toEqual(['perception', 'stealth'])
    // compétences de classe ÉLEVÉES 'proficient'→'expert' (pas de ligne en double)
    expect(await expertSkills(id)).toEqual(['perception', 'stealth'])
    // L'owner « Expertise » (class_feature visible) est matérialisé par le sweep passif.
    expect(await materializedFeatureIds(id)).toContain(FEATURE.rogueExpertise)
  })

  it('création : plus d\'expertises que le total dû au niveau → rejet', async () => {
    await expect(createRogue(1, { expertiseSkills: ['stealth', 'perception', 'acrobatics'] }))
      .rejects.toThrow(CharacterValidationError)
  })

  it('création : une classe sans expertise (Guerrier) qui envoie des expertises → rejet', async () => {
    await expect(createCharacter(db, createCharacterSchema.parse({
      name: 'Gonzo', maxHp: 12, classId: CLASS.fighter, level: 1, speciesId: SPECIES.human,
      abilityScores: { str: 16, dex: 14, con: 14, int: 8, wis: 10, cha: 10 },
      classSkills: ['athletics'], classSavingThrows: [], backgroundSkills: [], spellIds: [],
      expertiseSkills: ['athletics'],
    }), OWNER)).rejects.toThrow(CharacterValidationError)
  })

  it('level-up Roublard 5→6 : le second palier d\'expertise → character_choices', async () => {
    const { id } = await createRogue(5) // aucune expertise capturée à la création ici
    expect(await expertiseChoices(id)).toHaveLength(0)

    await characterLevelUp(db, id, levelUpSchema.parse({
      classId: CLASS.rogue, isMulticlass: false, hpGained: 6, expertiseSkills: ['stealth', 'perception'],
    }))

    expect(await expertiseChoices(id)).toEqual(['perception', 'stealth'])
    expect(await expertSkills(id)).toEqual(['perception', 'stealth'])
  })
})

const rogueLevel = async (sheetId: number): Promise<number | undefined> => {
  const [row] = await db.select({ level: schema.characterClasses.level })
    .from(schema.characterClasses)
    .where(eq(schema.characterClasses.characterSheetId, sheetId))
  return row?.level
}

const levelUpRogue = (sheetId: number, expertiseSkills: string[]) =>
  characterLevelUp(db, sheetId, levelUpSchema.parse({ classId: CLASS.rogue, isMulticlass: false, hpGained: 6, expertiseSkills }))

describe('expertise — validation serveur du level-up', () => {
  it('niveau sans palier d\'expertise (Roublard 1→2) → rejet, rien n\'est écrit', async () => {
    const { id } = await createRogue(1, { expertiseSkills: ['stealth', 'perception'] })

    await expect(levelUpRogue(id, ['insight'])).rejects.toThrow(/ne gagne pas d'expertise au niveau 2/)
    expect(await rogueLevel(id)).toBe(1)
    expect(await expertSkills(id)).toEqual(['perception', 'stealth'])
  })

  it('plus que le delta dû (Roublard 5→6 : 4 − 2 = 2) → rejet', async () => {
    const { id } = await createRogue(5, { expertiseSkills: ['stealth', 'perception'] })

    await expect(levelUpRogue(id, ['insight', 'deception', 'stealth'])).rejects.toThrow(/3 pour 2 gagnées au niveau 6/)
    expect(await rogueLevel(id)).toBe(5)
  })

  it('compétence déjà experte → rejet', async () => {
    const { id } = await createRogue(5, { expertiseSkills: ['stealth', 'perception'] })

    await expect(levelUpRogue(id, ['stealth', 'insight'])).rejects.toThrow(/« stealth » a déjà l'expertise/)
    expect(await rogueLevel(id)).toBe(5)
  })

  it('une expertise posée à la main sur la fiche compte comme déjà experte', async () => {
    const { id } = await createRogue(5, { expertiseSkills: ['stealth', 'perception'] })
    await db.insert(schema.characterSkills).values({ characterSheetId: id, skillKey: 'insight', proficiencyLevel: 'expert', source: 'manual', isOverride: true })

    await expect(levelUpRogue(id, ['deception', 'insight'])).rejects.toThrow(/« insight » a déjà l'expertise/)
  })

  it('moins que le delta → accepté (borne haute, comme à la création)', async () => {
    const { id } = await createRogue(5, { expertiseSkills: ['stealth', 'perception'] })

    await levelUpRogue(id, ['insight'])

    expect(await rogueLevel(id)).toBe(6)
    expect(await expertSkills(id)).toEqual(['insight', 'perception', 'stealth'])
  })

  it('multiclassage vers Roublard (0→1) : les 2 expertises du niveau 1 sont dues', async () => {
    const { id } = await createCharacter(db, createCharacterSchema.parse({
      name: 'Gonzo', maxHp: 12, classId: CLASS.fighter, level: 1, speciesId: SPECIES.human,
      abilityScores: { str: 16, dex: 14, con: 14, int: 8, wis: 10, cha: 10 },
      classSkills: ['athletics'], backgroundSkills: [], spellIds: [],
    }), OWNER)

    await characterLevelUp(db, id, levelUpSchema.parse({
      classId: CLASS.rogue, isMulticlass: true, hpGained: 5, expertiseSkills: ['athletics', 'perception'],
    }))

    expect(await expertSkills(id)).toEqual(['athletics', 'perception'])
  })

  it('classe sans expertise (Guerrier 1→2) → rejet', async () => {
    const { id } = await createCharacter(db, createCharacterSchema.parse({
      name: 'Gonzo', maxHp: 12, classId: CLASS.fighter, level: 1, speciesId: SPECIES.human,
      abilityScores: { str: 16, dex: 14, con: 14, int: 8, wis: 10, cha: 10 },
      classSkills: ['athletics'], backgroundSkills: [], spellIds: [],
    }), OWNER)

    await expect(characterLevelUp(db, id, levelUpSchema.parse({
      classId: CLASS.fighter, isMulticlass: false, hpGained: 7, expertiseSkills: ['athletics'],
    }))).rejects.toThrow(CharacterValidationError)
  })

  it('schéma : clé de compétence inconnue ou en double → refusée (level-up et création)', () => {
    const base = { classId: CLASS.rogue, isMulticlass: false, hpGained: 6 }
    expect(levelUpSchema.safeParse({ ...base, expertiseSkills: ['discretion'] }).success).toBe(false)
    expect(levelUpSchema.safeParse({ ...base, expertiseSkills: ['stealth', 'stealth'] }).success).toBe(false)
    expect(levelUpSchema.safeParse({ ...base, expertiseSkills: ['stealth', 'insight'] }).success).toBe(true)

    const creation = {
      name: 'Sly', maxHp: 9, classId: CLASS.rogue, level: 1,
      abilityScores: {}, classSkills: [], spellIds: [],
    }
    expect(createCharacterSchema.safeParse({ ...creation, expertiseSkills: ['discretion'] }).success).toBe(false)
    expect(createCharacterSchema.safeParse({ ...creation, expertiseSkills: ['stealth', 'stealth'] }).success).toBe(false)
  })
})
