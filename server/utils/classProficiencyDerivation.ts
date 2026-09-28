import { and, eq, inArray, or, type SQL } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as srcSchema from '~~/server/db/schema'
import type { Effect } from '~~/server/db/schema/effects'
import type { SkillKey } from '~~/shared/rules/skills'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

export interface ClassGrants {
  proficiencies: Effect[]
  savingThrows: Effect[]
}

// PHB (multiclassage) : la 1re classe accorde ses maîtrises de départ et ses JS ; une classe rejointe, un
// sous-ensemble de ses maîtrises (porteur `multiclass_proficiency_grant`) et aucun JS. Classe principale =
// celle marquée `isMain`, à défaut la première.
export async function deriveClassGrants(db: Db, classes: Array<{ classId: number, isMain: boolean }>): Promise<ClassGrants> {
  const mainClassId = classes.find(c => c.isMain)?.classId ?? classes[0]?.classId
  if (mainClassId == null) return { proficiencies: [], savingThrows: [] }
  const otherClassIds = classes.map(c => c.classId).filter(classId => classId !== mainClassId)

  const owners: SQL[] = [and(eq(srcSchema.features.classId, mainClassId), eq(srcSchema.features.featureType, 'proficiency_grant'))!]
  if (otherClassIds.length) {
    owners.push(and(inArray(srcSchema.features.classId, otherClassIds), eq(srcSchema.features.featureType, 'multiclass_proficiency_grant'))!)
  }
  const rows = await db
    .select({ featureType: srcSchema.features.featureType, type: srcSchema.effects.type, value: srcSchema.effects.value })
    .from(srcSchema.features)
    .innerJoin(srcSchema.featureEffects, eq(srcSchema.featureEffects.featureId, srcSchema.features.id))
    .innerJoin(srcSchema.effects, eq(srcSchema.effects.id, srcSchema.featureEffects.effectId))
    .where(or(...owners))

  const grants: ClassGrants = { proficiencies: [], savingThrows: [] }
  for (const r of rows) {
    const effect = { type: r.type, value: r.value } as Effect
    if (effect.type !== 'saving_throw_proficiency') grants.proficiencies.push(effect)
    else if (r.featureType === 'proficiency_grant') grants.savingThrows.push(effect)
  }
  return grants
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
