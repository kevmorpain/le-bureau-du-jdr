import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import { and, eq } from 'drizzle-orm'
import * as schema from '../../schema'
import type { FeatureChoice } from '~~/shared/rules/choices'

export type { FeatureChoice } from '~~/shared/rules/choices'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

/** Idempotent : ne crée la progression que si la feature n'en porte pas déjà une de ce `kind`. */
export async function ensureFeatureChoice(db: Db, featureId: number, choice: FeatureChoice): Promise<boolean> {
  const existing = await db
    .select({ id: schema.progression.id })
    .from(schema.progression)
    .where(and(eq(schema.progression.featureId, featureId), eq(schema.progression.kind, choice.kind)))
    .limit(1)
    .get()
  if (existing) return false
  await db.insert(schema.progression).values({
    featureId,
    kind: choice.kind,
    count: { op: 'fixed', value: choice.count },
    optionSource: choice.optionSource,
    replaceable: false,
  })
  return true
}
