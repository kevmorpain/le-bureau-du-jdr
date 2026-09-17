import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as srcSchema from '~~/server/db/schema'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

// Métamagie 2014 non remplaçable à la montée de niveau (contrairement aux invocations) : ajout seul.
export async function applyMetamagicChanges(
  db: Db,
  characterSheetId: number,
  newMetamagicIds: number[],
) {
  if (!newMetamagicIds.length) return

  await db
    .insert(srcSchema.characterFeatures)
    .values(newMetamagicIds.map(featureId => ({ characterSheetId, featureId, currentUses: 0 })))
    .onConflictDoNothing()
}
