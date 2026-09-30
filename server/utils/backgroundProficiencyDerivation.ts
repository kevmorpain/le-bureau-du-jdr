import { and, eq } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import type { Effect } from '~~/server/db/schema/effects'
import type { Db } from '~~/server/utils/db'

export async function deriveBackgroundProficiencies(db: Db, backgroundId: number | null | undefined): Promise<Effect[]> {
  if (backgroundId == null) return []
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
