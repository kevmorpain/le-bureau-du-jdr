import { and, eq, inArray, isNotNull, or } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import type { Db } from '~~/server/utils/db'
import type { Effect } from '~~/server/db/schema/effects'
import { deriveBackgroundProficiencies } from '~~/server/utils/backgroundProficiencyDerivation'
import { loadClassProficiencyGrants } from '~~/server/utils/classProficiencyDerivation'
import { buildCatalog } from '~~/server/utils/catalog'
import {
  duplicatedValues,
  proficiencyDuplicates,
  replacementsDueAtLevelUp,
  type DuplicateCounts,
  type DuplicateSources,
  type LevelUpReplacements,
} from '~~/shared/rules/duplicateProficiencies'
import { resolveChoices } from '~~/shared/rules/resolve'

const skillsOf = (effects: Effect[]) => effects.flatMap(e => e.type === 'skill_proficiency' ? [e.value.skill as string] : [])
const toolsOf = (effects: Effect[]) => effects.flatMap(e => e.type === 'tool_proficiency' ? [e.value] : [])

async function speciesEffects(db: Db, speciesId: number | null, lineageId: number | null): Promise<Effect[]> {
  if (speciesId == null) return []
  const featureIds = db
    .select({ id: schema.speciesFeatures.featureId })
    .from(schema.speciesFeatures)
    .where(eq(schema.speciesFeatures.speciesId, speciesId))
  const rows = await db
    .select({ type: schema.effects.type, value: schema.effects.value })
    .from(schema.featureEffects)
    .innerJoin(schema.effects, eq(schema.effects.id, schema.featureEffects.effectId))
    .innerJoin(schema.features, eq(schema.features.id, schema.featureEffects.featureId))
    .where(or(
      inArray(schema.featureEffects.featureId, featureIds),
      lineageId != null ? eq(schema.features.lineageId, lineageId) : undefined,
    ))
  return rows as Effect[]
}

interface DuplicateContext {
  mainClassId: number
  /** Classes rejointes par multiclassage : chacune apporte son sous-ensemble de maîtrises, pas celles de départ. */
  joinedClassIds?: number[]
  speciesId: number | null
  lineageId: number | null
  backgroundId: number | null
}

// Seules les maîtrises FIXES comptent (règle et raison dans shared/rules/duplicateProficiencies.ts).
async function duplicateSources(db: Db, { mainClassId, joinedClassIds = [], speciesId, lineageId, backgroundId }: DuplicateContext): Promise<DuplicateSources> {
  const species = await speciesEffects(db, speciesId, lineageId)
  const background = await deriveBackgroundProficiencies(db, backgroundId)
  const grants = await loadClassProficiencyGrants(db, [mainClassId, ...joinedClassIds])
  return {
    speciesSkills: skillsOf(species),
    backgroundSkills: skillsOf(background),
    classTools: [
      toolsOf(grants.get(mainClassId)?.start ?? []),
      ...joinedClassIds.map(id => toolsOf(grants.get(id)?.multiclass ?? [])),
    ],
    backgroundTools: toolsOf(background),
  }
}

export async function creationDuplicates(
  db: Db,
  { classId, speciesId, lineageId, backgroundId }: { classId: number, speciesId: number | null, lineageId: number | null, backgroundId: number | null },
): Promise<DuplicateCounts> {
  return proficiencyDuplicates(await duplicateSources(db, { mainClassId: classId, speciesId, lineageId, backgroundId }))
}

const NONE: LevelUpReplacements = { choices: [], duplicated: { skills: [], tools: [] } }
const newlyDuplicated = (after: string[], before: string[]) => after.filter(v => !before.includes(v))

// Remplacements ouverts en rejoignant `joinedClassId` par multiclassage : doublons d'après moins ceux d'avant
// (un doublon refusé à la création ne revient pas), moins les remplacements déjà enregistrés.
export async function levelUpReplacements(db: Db, characterSheetId: number, joinedClassId: number): Promise<LevelUpReplacements> {
  const sheet = await db
    .select({ speciesId: schema.characterSheets.speciesId, backgroundId: schema.characterSheets.backgroundId })
    .from(schema.characterSheets)
    .where(eq(schema.characterSheets.id, characterSheetId))
    .get()
  const classes = await db
    .select({ classId: schema.characterClasses.classId, level: schema.characterClasses.level, isMain: schema.characterClasses.isMain })
    .from(schema.characterClasses)
    .where(eq(schema.characterClasses.characterSheetId, characterSheetId))
  if (!sheet || !classes.length || classes.some(c => c.classId === joinedClassId)) return NONE

  const lineagePick = await db
    .select({ lineageId: schema.characterChoices.selectedLineageId })
    .from(schema.characterChoices)
    .where(and(eq(schema.characterChoices.characterSheetId, characterSheetId), isNotNull(schema.characterChoices.selectedLineageId)))
    .limit(1)
    .get()

  const mainClassId = (classes.find(c => c.isMain) ?? classes[0]!).classId
  const context = { mainClassId, speciesId: sheet.speciesId, lineageId: lineagePick?.lineageId ?? null, backgroundId: sheet.backgroundId }
  const otherClassIds = classes.filter(c => c.classId !== mainClassId).map(c => c.classId)
  const beforeSources = await duplicateSources(db, { ...context, joinedClassIds: otherClassIds })
  const afterSources = await duplicateSources(db, { ...context, joinedClassIds: [...otherClassIds, joinedClassId] })
  const before = proficiencyDuplicates(beforeSources)
  const after = proficiencyDuplicates(afterSources)
  if (after.skills <= before.skills && after.tools <= before.tools) return NONE

  const picks = await db
    .select({ progressionId: schema.characterChoices.progressionId })
    .from(schema.characterChoices)
    .where(eq(schema.characterChoices.characterSheetId, characterSheetId))
  const { choices } = resolveChoices({
    classLevels: Object.fromEntries([...classes.map(c => [c.classId, c.level] as const), [joinedClassId, 1]]),
    mainClassId,
    duplicates: after,
    picks,
  }, await buildCatalog(db, { classIds: [], speciesIds: [], lineageIds: [], backgroundIds: [] }))

  return {
    choices: replacementsDueAtLevelUp(choices.filter(c => c.global), before),
    duplicated: {
      skills: newlyDuplicated(duplicatedValues(afterSources.speciesSkills, afterSources.backgroundSkills), duplicatedValues(beforeSources.speciesSkills, beforeSources.backgroundSkills)),
      tools: newlyDuplicated(duplicatedValues(...afterSources.classTools, afterSources.backgroundTools), duplicatedValues(...beforeSources.classTools, beforeSources.backgroundTools)),
    },
  }
}
