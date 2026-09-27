import { and, eq, inArray, or, type SQL } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as srcSchema from '~~/server/db/schema'
import type { Effect } from '~~/server/db/schema/effects'
import type { SkillKey } from '~~/shared/rules/skills'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

// PHB (multiclassage) : seule la 1re classe accorde ses maîtrises de départ, une classe rejointe n'en donne
// qu'un sous-ensemble — porté par un porteur distinct, `multiclass_proficiency_grant`.
export async function deriveClassProficiencies(db: Db, mainClassId: number | null | undefined, otherClassIds: number[]): Promise<Effect[]> {
  const owners: SQL[] = []
  if (mainClassId != null) {
    owners.push(and(eq(srcSchema.features.classId, mainClassId), eq(srcSchema.features.featureType, 'proficiency_grant'))!)
  }
  if (otherClassIds.length) {
    owners.push(and(inArray(srcSchema.features.classId, otherClassIds), eq(srcSchema.features.featureType, 'multiclass_proficiency_grant'))!)
  }
  if (!owners.length) return []
  const rows = await db
    .select({ type: srcSchema.effects.type, value: srcSchema.effects.value })
    .from(srcSchema.features)
    .innerJoin(srcSchema.featureEffects, eq(srcSchema.featureEffects.featureId, srcSchema.features.id))
    .innerJoin(srcSchema.effects, eq(srcSchema.effects.id, srcSchema.featureEffects.effectId))
    .where(or(...owners))
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

// Les JS ne sont accordés que par la 1re classe (PHB) : dérivation scopée à la classe PRINCIPALE.
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
