import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import type { Ruleset } from '~~/shared/rules/ruleset'
import type { Source } from '~~/shared/rules/source'

const backgrounds = sqliteTable('backgrounds', {
  id: integer().primaryKey().notNull(),
  name: text().notNull(),
  ruleset: text('ruleset').$type<Ruleset>().notNull().default('5'),
  source: text('source').$type<Source>().notNull().default('core'),
  description: text().default('').notNull(),
  skillProficiencies: text('skill_proficiencies', { mode: 'json' }).$type<string[]>().default([]).notNull(),
  toolProficiencies: text('tool_proficiencies', { mode: 'json' }).$type<string[]>().default([]).notNull(),
  languageProficiencies: text('language_proficiencies', { mode: 'json' }).$type<string[]>().default([]).notNull(),
  featureName: text('feature_name').default('').notNull(),
  featureDescription: text('feature_description').default('').notNull(),
  // null = prédéfini global ; non-null = custom lié à un personnage (pas de FK pour éviter la référence circulaire)
  characterSheetId: integer('character_sheet_id'),
})

// FK non contrainte côté DB : elle créerait une référence circulaire avec character_sheets.
export const backgroundRelations = relations(backgrounds, () => ({}))

export default backgrounds
