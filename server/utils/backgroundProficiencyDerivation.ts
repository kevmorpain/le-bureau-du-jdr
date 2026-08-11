import { and, eq } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as srcSchema from '~~/server/db/schema'
import type { Effect } from '~~/server/db/schema/effects'

/**
 * Dérivation des MAÎTRISES d'outils/langues FIXES d'un historique (volet B, étape 2). L'historique
 * porte ses maîtrises fixes en effets sur une feature `proficiency_grant` liée par
 * `background_features` (posée par {@link seedBackgroundProficiencies}). La fiche en dérive LIVE les
 * effets — comme l'espèce dérive les siens — pour les fusionner dans `allEffects` (front), au lieu
 * de les matérialiser en grants. Patron {@link deriveWeaponMasteries} / {@link deriveChosenLineage} :
 * `db` INJECTÉ (testable libsql), lecture via le schéma FRAIS (`background_features` hors relations
 * hub:db → `.select().from()`, cf. son docstring).
 *
 * `[]` si l'historique n'a pas de porteur (historique custom, ou sans maîtrise fixe — ex. Acolyte,
 * Sage) → aucune régression. Les maîtrises « au choix » restent des deltas du joueur (grants).
 */

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
