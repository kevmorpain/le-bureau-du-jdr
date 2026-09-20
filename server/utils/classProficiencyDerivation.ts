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

// Les JS ne sont accordés que par la 1re classe (PHB) : dérivation scopée à la classe PRINCIPALE, pas
// à toutes (deriveClassProficiencies), pour ne pas donner les JS d'une classe multiclassée.
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
