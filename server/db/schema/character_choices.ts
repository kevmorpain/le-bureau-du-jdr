import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import type { AbilityKey } from '~~/shared/rules/abilities'
import type { SkillKey } from '~~/shared/rules/skills'
import characterSheets from './character_sheets'
import progression from './progression'
import subclasses from './subclasses'
import features from './features'
import spells from './spells'
import abilityScores from './ability_scores'

/**
 * `character_choices` — la CONFIG : une ligne = un pick atomique d'un personnage pour
 * une `progression`. Valeurs typées / FK partout où une table existe
 * ([D5](../../../docs/decisions.md#d5)) ; au plus une colonne `selected_*` renseignée.
 * `payload` porte les choix composés (la triade de caractéristiques d'un historique 5.5).
 *
 * Ces lignes ne sont PAS matérialisées en `character_features` : la fiche dérive live
 * les features/effets actifs en joignant `character_choices → features` + gating de
 * niveau ([D8](../../../docs/decisions.md#d8)). Pas de `relations()` (cf. progression.ts).
 * Config par personnage → aucune ligne seedée.
 */
const characterChoices = sqliteTable(
  'character_choices',
  {
    id: integer().primaryKey().notNull(),
    characterSheetId: integer('character_sheet_id').notNull().references(() => characterSheets.id, { onDelete: 'cascade' }),
    progressionId: integer('progression_id').notNull().references(() => progression.id, { onDelete: 'cascade' }),
    // Niveau de la classe propriétaire au moment du pick (utile en multiclasse).
    classLevel: integer('class_level'),
    // ─── Référentiel typé (au plus un renseigné) ───────────────────────────────
    selectedSubclassId: integer('selected_subclass_id').references(() => subclasses.id, { onDelete: 'cascade' }),
    selectedFeatureId: integer('selected_feature_id').references(() => features.id, { onDelete: 'cascade' }), // invocation / pacte / style / métamagie / manœuvre / don
    selectedSpellId: integer('selected_spell_id').references(() => spells.id, { onDelete: 'cascade' }),
    selectedAbilityId: text('selected_ability_id').references(() => abilityScores.id),
    // ─── Résiduel typé (seulement si aucune table) + composé ───────────────────
    selectedValue: text('selected_value').$type<SkillKey | (string & {})>(), // compétence / langue / outil
    payload: text('payload', { mode: 'json' }).$type<Partial<Record<AbilityKey, number>>>(), // triade {str:2, dex:1}
    createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
    updatedAt: text('updated_at'),
  },
  table => [
    index('character_choices_sheet_id_idx').on(table.characterSheetId),
    index('character_choices_progression_id_idx').on(table.progressionId),
    // Idempotence d'un pick : un même perso ne peut enregistrer deux fois la même
    // valeur pour un même point de choix. Les NULL sont distincts en SQLite, donc les
    // colonnes selected_* non renseignées n'entrent pas en collision (voulu).
    uniqueIndex('character_choices_unique').on(
      table.characterSheetId,
      table.progressionId,
      table.selectedSubclassId,
      table.selectedFeatureId,
      table.selectedSpellId,
      table.selectedAbilityId,
      table.selectedValue,
    ),
  ],
)

export default characterChoices
