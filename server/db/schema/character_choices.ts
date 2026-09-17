import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import type { AbilityKey } from '~~/shared/rules/abilities'
import type { SkillKey } from '~~/shared/rules/skills'
import characterSheets from './character_sheets'
import progression from './progression'
import subclasses from './subclasses'
import speciesLineages from './species_lineages'
import features from './features'
import spells from './spells'
import abilityScores from './ability_scores'

// Un pick atomique par ligne ; au plus une colonne `selected_*` renseignée. `payload` porte les choix
// composés. Pas de `relations()` (cf. progression.ts).
const characterChoices = sqliteTable(
  'character_choices',
  {
    id: integer().primaryKey().notNull(),
    characterSheetId: integer('character_sheet_id').notNull().references(() => characterSheets.id, { onDelete: 'cascade' }),
    progressionId: integer('progression_id').notNull().references(() => progression.id, { onDelete: 'cascade' }),
    // Niveau de la classe propriétaire au moment du pick (utile en multiclasse).
    classLevel: integer('class_level'),
    selectedSubclassId: integer('selected_subclass_id').references(() => subclasses.id, { onDelete: 'cascade' }),
    selectedLineageId: integer('selected_lineage_id').references(() => speciesLineages.id, { onDelete: 'cascade' }), // lignée (sous-race 2014 / lignée 2024), cf. D17
    selectedFeatureId: integer('selected_feature_id').references(() => features.id, { onDelete: 'cascade' }), // invocation / pacte / style / métamagie / manœuvre / don
    selectedSpellId: integer('selected_spell_id').references(() => spells.id, { onDelete: 'cascade' }),
    selectedAbilityId: text('selected_ability_id').references(() => abilityScores.id),
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
      table.selectedLineageId,
      table.selectedFeatureId,
      table.selectedSpellId,
      table.selectedAbilityId,
      table.selectedValue,
    ),
  ],
)

export default characterChoices
