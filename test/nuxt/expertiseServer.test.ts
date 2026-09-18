import { describe, it, expect, beforeAll } from 'vitest'
import { eq } from 'drizzle-orm'
import * as schema from '../../server/db/schema'
import { createCharacter, createCharacterSchema, CharacterValidationError } from '../../server/utils/characterCreate'
import { characterLevelUp, levelUpSchema } from '../../server/utils/characterLevelUp'
import { bootstrapGoldenDb, OWNER, CLASS, SPECIES, FEATURE } from './fixtures/goldenMaster'

// Expertise — autorité serveur (F2 tranche 2). Prouve que la création CAPTURE l'expertise (le trou
// comblé) et que le level-up écrit character_choices, tous deux via la même machinerie que les
// invocations : character_choices (source de décision) + character_skills 'expert'.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any

beforeAll(async () => {
  ;({ db } = await bootstrapGoldenDb())
}, 60000)

const createRogue = (level: number, over: Record<string, unknown> = {}) =>
  createCharacter(db, createCharacterSchema.parse({
    name: 'Sly', maxHp: 9, classId: CLASS.rogue, level, speciesId: SPECIES.human,
    abilityScores: { str: 10, dex: 16, con: 12, int: 13, wis: 11, cha: 14 },
    classSkills: ['stealth', 'perception'], classSavingThrows: ['dex', 'int'], backgroundSkills: [], spellIds: [],
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

describe('expertise — autorité serveur (F2 tranche 2)', () => {
  it('création Roublard niv 1 : 2 expertises → character_choices + compétences \'expert\' + feature « Expertise » matérialisée', async () => {
    const { id } = await createRogue(1, { expertiseSkills: ['stealth', 'perception'] })

    expect(await expertiseChoices(id)).toEqual(['perception', 'stealth'])
    // Les 2 compétences de classe insérées 'proficient' sont ÉLEVÉES à 'expert' (pas de doublon).
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
