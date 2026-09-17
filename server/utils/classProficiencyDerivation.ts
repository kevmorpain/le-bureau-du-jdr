import { and, eq, inArray } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as srcSchema from '~~/server/db/schema'
import type { Effect } from '~~/server/db/schema/effects'

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
