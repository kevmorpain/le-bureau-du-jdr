import { and, eq } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as srcSchema from '~~/server/db/schema'
import type { AbilityKey } from '~~/shared/rules/abilities'

/**
 * Dérivation de la TRIADE d'origine 2024 (choix composite `ability_scores`, cf. C1/C3). Le
 * personnage a enregistré sa répartition (+2/+1 ou +1/+1/+1) en `character_choices.payload` à la
 * création ; la fiche en dérive LIVE l'augmentation de caractéristiques — exactement comme la
 * lignée dérive ses features ({@link deriveChosenLineage}). Somme les payloads de TOUS les points
 * de choix `ability_scores` du perso.
 *
 * `character_choices` / `progression` sont hors des relations du cache `hub:db` → `.select()`
 * explicite + merge JS (patron subclasses/ASI/lignée du GET fiche). `db` INJECTÉ → testable sur
 * libsql. **No-op** (map vide) tant qu'aucun pick `ability_scores` — le cas de TOUTES les fiches
 * 2014 (aucune progression `ability_scores` n'y existe) → dérivation inchangée.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

export async function deriveAbilityScoreChoices(db: Db, characterSheetId: number): Promise<Partial<Record<AbilityKey, number>>> {
  const rows = await db
    .select({ payload: srcSchema.characterChoices.payload })
    .from(srcSchema.characterChoices)
    .innerJoin(srcSchema.progression, eq(srcSchema.progression.id, srcSchema.characterChoices.progressionId))
    .where(and(
      eq(srcSchema.characterChoices.characterSheetId, characterSheetId),
      eq(srcSchema.progression.kind, 'ability_scores'),
    ))

  const bonuses: Partial<Record<AbilityKey, number>> = {}
  for (const r of rows) {
    const payload = r.payload as Partial<Record<AbilityKey, number>> | null
    if (!payload) continue
    for (const [ability, amount] of Object.entries(payload) as [AbilityKey, number][]) {
      if (typeof amount === 'number') bonuses[ability] = (bonuses[ability] ?? 0) + amount
    }
  }
  return bonuses
}
