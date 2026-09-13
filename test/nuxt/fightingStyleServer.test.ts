import { describe, it, expect, beforeAll } from 'vitest'
import { eq } from 'drizzle-orm'
import * as schema from '../../server/db/schema'
import { createCharacter, createCharacterSchema } from '../../server/utils/characterCreate'
import { characterLevelUp, levelUpSchema } from '../../server/utils/characterLevelUp'
import { bootstrapGoldenDb, OWNER, CLASS, SPECIES, FEATURE } from './fixtures/goldenMaster'

// ─────────────────────────────────────────────────────────────────────────────
// STYLE DE COMBAT — autorité serveur (F2 tranche 2). Le golden-master (archétype A) couvre déjà la
// CRÉATION du Guerrier (« Défense » niv 1). Ce test cible ce qu'il ne couvre pas :
//  - la MONTÉE de niveau (Paladin 1→2 : le style se débloque au niv 2) ;
//  - le GATING PAR NIVEAU (autorité serveur) : un Paladin niv 1 qui envoie un style ne le reçoit PAS ;
//  - la matérialisation en character_features + l'écriture en character_choices.
//
// Réutilise le catalogue du golden-master (Guerrier FS niv 1, Paladin FS niv 2).
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any

beforeAll(async () => {
  ;({ db } = await bootstrapGoldenDb())
}, 60000)

const createPaladin = (level: number, over: Record<string, unknown> = {}) =>
  createCharacter(db, createCharacterSchema.parse({
    name: 'Pal', maxHp: 10, classId: CLASS.paladin, level, speciesId: SPECIES.human,
    abilityScores: { str: 15, dex: 10, con: 14, int: 8, wis: 10, cha: 14 },
    classSkills: [], classSavingThrows: [], backgroundSkills: [], spellIds: [],
    ...over,
  }), OWNER)

const fightingStyleChoices = async (sheetId: number) => {
  const rows = await db.select({
    selectedFeatureId: schema.characterChoices.selectedFeatureId,
    kind: schema.progression.kind,
  })
    .from(schema.characterChoices)
    .innerJoin(schema.progression, eq(schema.progression.id, schema.characterChoices.progressionId))
    .where(eq(schema.characterChoices.characterSheetId, sheetId))
  return rows.filter((r: { kind: string }) => r.kind === 'fighting_style')
}

const materializedFeatureIds = async (sheetId: number): Promise<number[]> => {
  const rows = await db.select({ featureId: schema.characterFeatures.featureId })
    .from(schema.characterFeatures)
    .where(eq(schema.characterFeatures.characterSheetId, sheetId))
  return rows.map((r: { featureId: number }) => r.featureId)
}

describe('style de combat — autorité serveur (F2 tranche 2)', () => {
  it('création Guerrier niv 1 : « Archerie » persisté en character_choices + matérialisé', async () => {
    const { id } = await createCharacter(db, createCharacterSchema.parse({
      name: 'Gonzo', maxHp: 12, classId: CLASS.fighter, level: 1, speciesId: SPECIES.human,
      abilityScores: { str: 16, dex: 14, con: 14, int: 8, wis: 10, cha: 10 },
      classSkills: [], classSavingThrows: [], backgroundSkills: [], spellIds: [],
      fightingStyle: 'Archerie',
    }), OWNER)

    const choices = await fightingStyleChoices(id)
    expect(choices).toHaveLength(1)
    expect(choices[0]!.selectedFeatureId).toBe(FEATURE.fighterFsArchery)
    expect(await materializedFeatureIds(id)).toContain(FEATURE.fighterFsArchery)
  })

  it('GATING : Paladin niv 1 qui envoie un style → NON persisté (accès au niv 2)', async () => {
    const { id } = await createPaladin(1, { fightingStyle: 'Défense' })
    expect(await fightingStyleChoices(id)).toHaveLength(0)
    expect(await materializedFeatureIds(id)).not.toContain(FEATURE.paladinFsDefense)
  })

  it('level-up Paladin 1→2 : « Défense » débloqué → character_choices + matérialisation', async () => {
    const { id } = await createPaladin(1)
    expect(await fightingStyleChoices(id)).toHaveLength(0) // rien au niv 1

    await characterLevelUp(db, id, levelUpSchema.parse({
      classId: CLASS.paladin, isMulticlass: false, hpGained: 6, fightingStyle: 'Défense',
    }))

    const choices = await fightingStyleChoices(id)
    expect(choices).toHaveLength(1)
    expect(choices[0]!.selectedFeatureId).toBe(FEATURE.paladinFsDefense)
    expect(await materializedFeatureIds(id)).toContain(FEATURE.paladinFsDefense)
  })

  it('classe non martiale (Magicien) : un style envoyé est ignoré (pas de progression)', async () => {
    const { id } = await createCharacter(db, createCharacterSchema.parse({
      name: 'Merlin', maxHp: 8, classId: CLASS.wizard, level: 1, speciesId: SPECIES.human,
      abilityScores: { str: 8, dex: 14, con: 12, int: 16, wis: 10, cha: 10 },
      classSkills: [], classSavingThrows: [], backgroundSkills: [], spellIds: [],
      fightingStyle: 'Défense',
    }), OWNER)
    expect(await fightingStyleChoices(id)).toHaveLength(0)
  })
})
