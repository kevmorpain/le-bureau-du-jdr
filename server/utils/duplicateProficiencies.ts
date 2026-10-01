import { eq, inArray, or } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as srcSchema from '~~/server/db/schema'
import type { Effect } from '~~/server/db/schema/effects'
import { deriveBackgroundProficiencies } from '~~/server/utils/backgroundProficiencyDerivation'
import { loadClassProficiencyGrants } from '~~/server/utils/classProficiencyDerivation'
import { duplicateCount } from '~~/shared/rules/duplicateProficiencies'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

const skillsOf = (effects: Effect[]) => effects.flatMap(e => e.type === 'skill_proficiency' ? [e.value.skill as string] : [])
const toolsOf = (effects: Effect[]) => effects.flatMap(e => e.type === 'tool_proficiency' ? [e.value] : [])

async function speciesEffects(db: Db, speciesId: number | null, lineageId: number | null): Promise<Effect[]> {
  if (speciesId == null) return []
  const featureIds = db
    .select({ id: srcSchema.speciesFeatures.featureId })
    .from(srcSchema.speciesFeatures)
    .where(eq(srcSchema.speciesFeatures.speciesId, speciesId))
  const rows = await db
    .select({ type: srcSchema.effects.type, value: srcSchema.effects.value })
    .from(srcSchema.featureEffects)
    .innerJoin(srcSchema.effects, eq(srcSchema.effects.id, srcSchema.featureEffects.effectId))
    .innerJoin(srcSchema.features, eq(srcSchema.features.id, srcSchema.featureEffects.featureId))
    .where(or(
      inArray(srcSchema.featureEffects.featureId, featureIds),
      lineageId != null ? eq(srcSchema.features.lineageId, lineageId) : undefined,
    ))
  return rows as Effect[]
}

// Remplacements dus à la création : compétences d'espèce ∩ d'historique, outils de classe ∩ d'historique. Seules
// les maîtrises FIXES comptent (règle et raison dans shared/rules/duplicateProficiencies.ts).
export async function creationDuplicates(
  db: Db,
  { classId, speciesId, lineageId, backgroundId }: { classId: number, speciesId: number | null, lineageId: number | null, backgroundId: number | null },
): Promise<{ skills: number, tools: number }> {
  const species = await speciesEffects(db, speciesId, lineageId)
  const background = await deriveBackgroundProficiencies(db, backgroundId)
  const classStart = (await loadClassProficiencyGrants(db, [classId])).get(classId)?.start ?? []
  return {
    skills: duplicateCount(skillsOf(species), skillsOf(background)),
    tools: duplicateCount(toolsOf(classStart), toolsOf(background)),
  }
}
