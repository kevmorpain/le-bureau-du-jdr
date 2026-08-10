import { and, eq } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as srcSchema from '~~/server/db/schema'

/**
 * Dérivation des MAÎTRISES D'ARMES choisies (choix composite `weapon_mastery`, cf. C1/C4). Le
 * perso a enregistré, à chaque point de choix `weapon_mastery`, les armes dont il maîtrise la
 * propriété — une ligne `character_choices.selected_value` par arme (comme les compétences). La
 * fiche en dérive LIVE la liste, patron {@link deriveChosenLineage} / {@link deriveAbilityScoreChoices}.
 *
 * `db` INJECTÉ → testable sur libsql. **No-op** (`[]`) tant qu'aucun pick `weapon_mastery` — le
 * cas de TOUTES les fiches 2014. L'EFFET de maîtrise (items.mastery_property → jet d'attaque,
 * cf. shared/rules/masteryProperties.ts) est appliqué en aval par le front (câblage différé,
 * comme `originAbilityBonuses`).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = BaseSQLiteDatabase<'async', any, any>

export async function deriveWeaponMasteries(db: Db, characterSheetId: number): Promise<string[]> {
  const rows = await db
    .select({ value: srcSchema.characterChoices.selectedValue })
    .from(srcSchema.characterChoices)
    .innerJoin(srcSchema.progression, eq(srcSchema.progression.id, srcSchema.characterChoices.progressionId))
    .where(and(
      eq(srcSchema.characterChoices.characterSheetId, characterSheetId),
      eq(srcSchema.progression.kind, 'weapon_mastery'),
    ))
  return rows.map(r => r.value).filter((v): v is string => typeof v === 'string')
}
