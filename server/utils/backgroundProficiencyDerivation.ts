import { and, eq } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as srcSchema from '~~/server/db/schema'
import type { Effect } from '~~/server/db/schema/effects'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

export async function deriveBackgroundProficiencies(db: Db, backgroundId: number | null | undefined): Promise<Effect[]> {
  if (backgroundId == null) return []
  const rows = await db
    .select({ type: srcSchema.effects.type, value: srcSchema.effects.value })
    .from(srcSchema.backgroundFeatures)
    .innerJoin(srcSchema.features, eq(srcSchema.features.id, srcSchema.backgroundFeatures.featureId))
    .innerJoin(srcSchema.featureEffects, eq(srcSchema.featureEffects.featureId, srcSchema.features.id))
    .innerJoin(srcSchema.effects, eq(srcSchema.effects.id, srcSchema.featureEffects.effectId))
    .where(and(
      eq(srcSchema.backgroundFeatures.backgroundId, backgroundId),
      eq(srcSchema.features.featureType, 'proficiency_grant'),
    ))
  return rows.map(r => ({ type: r.type, value: r.value }) as Effect)
}
