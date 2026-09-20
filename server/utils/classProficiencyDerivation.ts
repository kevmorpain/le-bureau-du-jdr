import { and, eq, inArray } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as srcSchema from '~~/server/db/schema'
import type { Effect } from '~~/server/db/schema/effects'
import type { SkillKey } from '~~/shared/rules/skills'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

export async function deriveClassProficiencies(db: Db, classIds: number[]): Promise<Effect[]> {
  if (!classIds.length) return []
  const rows = await db
    .select({ type: srcSchema.effects.type, value: srcSchema.effects.value })
    .from(srcSchema.features)
    .innerJoin(srcSchema.featureEffects, eq(srcSchema.featureEffects.featureId, srcSchema.features.id))
    .innerJoin(srcSchema.effects, eq(srcSchema.effects.id, srcSchema.featureEffects.effectId))
    .where(and(
      inArray(srcSchema.features.classId, classIds),
      eq(srcSchema.features.featureType, 'proficiency_grant'),
    ))
  return rows.map(r => ({ type: r.type, value: r.value }) as Effect)
}

// Compétences de classe CHOISIES → dérivées du pick stocké en character_choices (progression `skill`),
// F3 tranche 3. Le choix est enregistré à la création ; la maîtrise 'proficient' est produite ici.
export async function deriveClassSkills(db: Db, characterSheetId: number): Promise<Effect[]> {
  const rows = await db
    .select({ value: srcSchema.characterChoices.selectedValue })
    .from(srcSchema.characterChoices)
    .innerJoin(srcSchema.progression, eq(srcSchema.progression.id, srcSchema.characterChoices.progressionId))
    .where(and(
      eq(srcSchema.characterChoices.characterSheetId, characterSheetId),
      eq(srcSchema.progression.kind, 'skill'),
    ))
  return rows
    .filter((r): r is { value: string } => r.value != null)
    .map(r => ({ type: 'skill_proficiency', value: { skill: r.value as SkillKey } }) as Effect)
}

// Les JS ne sont accordés que par la 1re classe (PHB) : dérivation scopée à la classe PRINCIPALE, pas
// à toutes (deriveClassProficiencies), pour ne pas donner les JS d'une classe multiclassée.
export async function deriveMainClassSavingThrows(db: Db, mainClassId: number | null | undefined): Promise<Effect[]> {
  if (mainClassId == null) return []
  const rows = await db
    .select({ type: srcSchema.effects.type, value: srcSchema.effects.value })
    .from(srcSchema.features)
    .innerJoin(srcSchema.featureEffects, eq(srcSchema.featureEffects.featureId, srcSchema.features.id))
    .innerJoin(srcSchema.effects, eq(srcSchema.effects.id, srcSchema.featureEffects.effectId))
    .where(and(
      eq(srcSchema.features.classId, mainClassId),
      eq(srcSchema.features.featureType, 'proficiency_grant'),
      eq(srcSchema.effects.type, 'saving_throw_proficiency'),
    ))
  return rows.map(r => ({ type: r.type, value: r.value }) as Effect)
}
