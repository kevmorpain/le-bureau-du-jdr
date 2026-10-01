import { eq, inArray, or } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import type { Db } from '~~/server/utils/db'
import type { Effect } from '~~/server/db/schema/effects'
import { deriveBackgroundProficiencies } from '~~/server/utils/backgroundProficiencyDerivation'
import { loadClassProficiencyGrants } from '~~/server/utils/classProficiencyDerivation'
import { duplicateCount } from '~~/shared/rules/duplicateProficiencies'

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
