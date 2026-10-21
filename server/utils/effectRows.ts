import { and, eq } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import type { Effect } from '~~/server/db/schema/effects'
import type { Db } from '~~/server/utils/db'

// Une ligne `effects` est partagée par tous les porteurs du même effet : on la retrouve par (type, valeur)
// avant d'en insérer une.
export async function effectIdFor(db: Db, effect: Effect): Promise<number> {
  const existing = await db
    .select({ id: schema.effects.id })
    .from(schema.effects)
    .where(and(eq(schema.effects.type, effect.type), eq(schema.effects.value, effect.value)))
    .limit(1)
    .get()
  if (existing) return existing.id
  const inserted = await db.insert(schema.effects).values({ type: effect.type, value: effect.value }).returning({ id: schema.effects.id }).get()
  return inserted!.id
}
