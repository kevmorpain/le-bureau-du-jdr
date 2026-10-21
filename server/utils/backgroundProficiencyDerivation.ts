import { and, eq } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import type { Effect } from '~~/server/db/schema/effects'
import type { Db } from '~~/server/utils/db'
import { SKILL_KEYS, type SkillKey } from '~~/shared/rules/skills'

// Un historique seedé porte ses maîtrises sur un porteur ; un historique personnalisé (rattaché à une fiche),
// dans ses propres colonnes.
export async function deriveBackgroundProficiencies(db: Db, backgroundId: number | null | undefined): Promise<Effect[]> {
  if (backgroundId == null) return []
  const [background] = await db
    .select({
      characterSheetId: schema.backgrounds.characterSheetId,
      skills: schema.backgrounds.skillProficiencies,
      tools: schema.backgrounds.toolProficiencies,
      languages: schema.backgrounds.languageProficiencies,
    })
    .from(schema.backgrounds)
    .where(eq(schema.backgrounds.id, backgroundId))
    .limit(1)
  if (background?.characterSheetId != null) {
    return [
      ...background.skills
        .filter((skill): skill is SkillKey => (SKILL_KEYS as readonly string[]).includes(skill))
        .map((skill): Effect => ({ type: 'skill_proficiency', value: { skill } })),
      ...background.tools.map((value): Effect => ({ type: 'tool_proficiency', value })),
      ...background.languages.map((value): Effect => ({ type: 'language_proficiency', value })),
    ]
  }
  const rows = await db
    .select({ type: schema.effects.type, value: schema.effects.value })
    .from(schema.backgroundFeatures)
    .innerJoin(schema.features, eq(schema.features.id, schema.backgroundFeatures.featureId))
    .innerJoin(schema.featureEffects, eq(schema.featureEffects.featureId, schema.features.id))
    .innerJoin(schema.effects, eq(schema.effects.id, schema.featureEffects.effectId))
    .where(and(
      eq(schema.backgroundFeatures.backgroundId, backgroundId),
      eq(schema.features.featureType, 'proficiency_grant'),
    ))
  return rows.map(r => ({ type: r.type, value: r.value }) as Effect)
}
