import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import { and, eq } from 'drizzle-orm'
import * as schema from '../../schema'
import type { ChoiceKind, OptionSource } from '~~/shared/rules/choices'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

// Point de choix porté par une feature (trait d'espèce ou de lignée, porteur de classe ou d'historique) :
// le pick est stocké en `character_choices`, la maîtrise dérivée à la lecture.
export interface FeatureChoice {
  kind: ChoiceKind
  count: number
  optionSource: OptionSource
}

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
