import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

const backgrounds = sqliteTable('backgrounds', {
  id: integer().primaryKey().notNull(),
  name: text().notNull(),
  // '5' (D&D 2014) ou '5.5' (D&D 2024). En 5.5 l'historique porte aussi le
  // triplet de carac. et le don d'origine (colonnes ajoutées dans un lot ultérieur).
  ruleset: text('ruleset').$type<'5' | '5.5'>().default('5').notNull(),
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
