import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

const backgrounds = sqliteTable('backgrounds', {
  id: integer().primaryKey().notNull(),
  name: text().notNull(),
  description: text().default('').notNull(),
  skillProficiencies: text('skill_proficiencies', { mode: 'json' }).$type<string[]>().default([]).notNull(),
  toolProficiencies: text('tool_proficiencies', { mode: 'json' }).$type<string[]>().default([]).notNull(),
  languageProficiencies: text('language_proficiencies', { mode: 'json' }).$type<string[]>().default([]).notNull(),
  featureName: text('feature_name').default('').notNull(),
  featureDescription: text('feature_description').default('').notNull(),
  // null = prédéfini global ; non-null = custom lié à un personnage (pas de FK pour éviter la référence circulaire)
  characterSheetId: integer('character_sheet_id'),
})

// Les relations sont déclarées ici mais la FK n'est pas contrainte au niveau DB
// pour éviter la référence circulaire avec character_sheets
export const backgroundRelations = relations(backgrounds, () => ({}))

export default backgrounds
