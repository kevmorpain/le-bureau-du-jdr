import { eq } from 'drizzle-orm'
import * as schema from '~~/server/db/schema'
import type { Db } from '~~/server/utils/db'
import type { Preferences } from '~~/shared/rules/preferences'

export const readAccountPreferences = async (db: Db, userId: number): Promise<Preferences | null> => {
  const [row] = await db.select({ preferences: schema.users.preferences }).from(schema.users).where(eq(schema.users.id, userId))
  return row?.preferences ?? null
}

// Aucune clé posée = tout hérite du défaut codé : on range NULL plutôt qu'un objet vide, comme sur la fiche.
export const writeAccountPreferences = async (db: Db, userId: number, preferences: Preferences): Promise<Preferences | null> => {
  const next = Object.keys(preferences).length ? preferences : null
  await db.update(schema.users).set({ preferences: next }).where(eq(schema.users.id, userId))
  return next
}
