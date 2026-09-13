import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as srcSchema from '~~/server/db/schema'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

/**
 * Ajoute des options de Métamagie (Ensorceleur) apprises au level-up. Les options choisies sont
 * des `character_features` (comme les invocations) mais SANS spell_grant → util plus simple.
 *
 * ⚠️ Contrairement aux invocations occultes, la Métamagie 2014 n'est PAS remplaçable à la montée
 * de niveau (règles PHB) : cet util n'ajoute donc que des options, il n'en retire jamais.
 *
 * `db` est INJECTÉ (D1 en prod, libsql en test). ⚠️ D1 ne supporte pas BEGIN TRANSACTION :
 * `onConflictDoNothing` pour l'idempotence.
 */
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
