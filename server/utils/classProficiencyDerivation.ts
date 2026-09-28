import { and, eq, inArray } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as srcSchema from '~~/server/db/schema'
import type { Effect } from '~~/server/db/schema/effects'
import type { SkillKey } from '~~/shared/rules/skills'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

// Maîtrises d'une classe lues sur ses porteurs : de départ (armes, armures, outils) et JS pour la 1re classe
// (`proficiency_grant`), sous-ensemble reçu en la rejoignant par multiclassage (`multiclass_proficiency_grant`).
export interface ClassProficiencyGrants {
  start: Effect[]
  savingThrows: Effect[]
  multiclass: Effect[]
}

export async function loadClassProficiencyGrants(db: Db, classIds: number[]): Promise<Map<number, ClassProficiencyGrants>> {
  const grants = new Map<number, ClassProficiencyGrants>(classIds.map(id => [id, { start: [], savingThrows: [], multiclass: [] }]))
  if (!classIds.length) return grants
  const rows = await db
    .select({
      classId: srcSchema.features.classId,
      featureType: srcSchema.features.featureType,
      type: srcSchema.effects.type,
      value: srcSchema.effects.value,
    })
    .from(srcSchema.features)
    .innerJoin(srcSchema.featureEffects, eq(srcSchema.featureEffects.featureId, srcSchema.features.id))
    .innerJoin(srcSchema.effects, eq(srcSchema.effects.id, srcSchema.featureEffects.effectId))
    .where(and(
      inArray(srcSchema.features.classId, classIds),
      inArray(srcSchema.features.featureType, ['proficiency_grant', 'multiclass_proficiency_grant']),
    ))

  for (const r of rows) {
    const classGrants = grants.get(r.classId!)!
    const effect = { type: r.type, value: r.value } as Effect
    if (r.featureType === 'multiclass_proficiency_grant') classGrants.multiclass.push(effect)
    else if (effect.type === 'saving_throw_proficiency') classGrants.savingThrows.push(effect)
    else classGrants.start.push(effect)
  }
  return grants
}

export interface ClassGrants {
  proficiencies: Effect[]
  savingThrows: Effect[]
}

// PHB (multiclassage) : la 1re classe accorde ses maîtrises de départ et ses JS ; une classe rejointe, son
// sous-ensemble de multiclassage et aucun JS. Classe principale = celle marquée `isMain`, à défaut la première.
export async function deriveClassGrants(db: Db, classes: Array<{ classId: number, isMain: boolean }>): Promise<ClassGrants> {
  const mainClassId = classes.find(c => c.isMain)?.classId ?? classes[0]?.classId
  if (mainClassId == null) return { proficiencies: [], savingThrows: [] }
  const carriers = await loadClassProficiencyGrants(db, classes.map(c => c.classId))
  const main = carriers.get(mainClassId)!
  return {
    proficiencies: [
      ...main.start,
      ...classes.filter(c => c.classId !== mainClassId).flatMap(c => carriers.get(c.classId)!.multiclass),
    ],
    savingThrows: main.savingThrows,
  }
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
