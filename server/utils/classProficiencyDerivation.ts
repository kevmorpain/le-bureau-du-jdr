import { and, eq, inArray } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as srcSchema from '~~/server/db/schema'
import type { Effect } from '~~/server/db/schema/effects'

/**
 * Dérivation des MAÎTRISES d'armes/armures de BASE d'une classe (volet B, étape 4 — pendant
 * classe du {@link deriveBackgroundProficiencies} de l'étape 2). Chaque classe porte ses maîtrises
 * de base en effets `weapon_proficiency`/`proficiency` sur une feature `proficiency_grant`
 * (`features.class_id` renseigné, posée par `seedClass` depuis la source unique
 * `CLASS_PROFICIENCIES`). La fiche en dérive LIVE les effets — comme l'espèce/l'historique dérivent
 * les leurs — pour les fusionner dans `allEffects` (front, `useCharacterInventory`), au lieu de les
 * matérialiser en grants. Patron {@link deriveBackgroundProficiencies} : `db` INJECTÉ (testable
 * libsql), lecture via le schéma FRAIS (le porteur est exclu des relations de matérialisation).
 *
 * Multiclasse : on dérive de TOUTES les classes du perso (le porteur n'est jamais matérialisé, donc
 * ses effets ne transitent pas par `character_features`). `[]` si aucune classe n'a de porteur seedé
 * (classe hors `CLASS_PROFICIENCIES`, ou base pas encore seedée) → aucune régression.
 */

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
