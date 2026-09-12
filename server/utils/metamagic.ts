import { and, eq } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as srcSchema from '~~/server/db/schema'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

/**
 * Applique l'ajout / remplacement d'options de Métamagie (Ensorceleur) au level-up.
 * Les options choisies sont des `character_features` (comme les invocations) mais SANS
 * spell_grant → util plus simple qu'`applyInvocationChanges` (aucune matérialisation de sorts).
 *
 * `db` est INJECTÉ (D1 en prod, libsql en test). ⚠️ D1 ne supporte pas BEGIN TRANSACTION :
 * statements séquentiels + `onConflictDoNothing` pour l'idempotence.
 */
export async function applyMetamagicChanges(
  db: Db,
  characterSheetId: number,
  newMetamagicIds: number[],
  replacedMetamagicId: number | null,
) {
  // Remplacement (une option échangeable par montée de niveau, PHB) : retirer l'ancienne feature.
  if (replacedMetamagicId) {
    await db
      .delete(srcSchema.characterFeatures)
      .where(and(
        eq(srcSchema.characterFeatures.characterSheetId, characterSheetId),
        eq(srcSchema.characterFeatures.featureId, replacedMetamagicId),
      ))
  }

  if (!newMetamagicIds.length) return

  await db
    .insert(srcSchema.characterFeatures)
    .values(newMetamagicIds.map(featureId => ({ characterSheetId, featureId, currentUses: 0 })))
    .onConflictDoNothing()
}
