import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import characterSheets from './character_sheets'
import features from './features'
import type { AbilityScoreKey } from './effects'

export type CharacterFeatureSource = 'asi' | 'bonus' | 'class' | 'subclass' | 'species' | 'invocation'

// Choix résolus d'un don au moment où il est pris (ex : caractéristique +1
// pour Observateur / Résilient / Athlète…). Volontairement souple/extensible.
export interface FeatChoices {
  ability?: AbilityScoreKey
}

const characterFeatures = sqliteTable(
  'character_features',
  {
    characterSheetId: integer('character_sheet_id').notNull().references(() => characterSheets.id, { onDelete: 'cascade' }),
    featureId: integer('feature_id').notNull().references(() => features.id, { onDelete: 'cascade' }),
    currentUses: integer('current_uses').default(0).notNull(),
    // Source utile pour les dons (asi vs bonus MJ). Pour les autres features
    // (class, subclass, species, invocation), c'est dérivable de feature.featureType
    // mais on autorise le stockage explicite.
    source: text('source').$type<CharacterFeatureSource>(),
    classLevel: integer('class_level'),
    choices: text('choices', { mode: 'json' }).$type<FeatChoices>(),
  },
  table => [primaryKey({ columns: [table.characterSheetId, table.featureId] })],
)

export const characterFeaturesRelations = relations(characterFeatures, ({ one }) => ({
  characterSheet: one(characterSheets, {
    fields: [characterFeatures.characterSheetId],
    references: [characterSheets.id],
  }),
  feature: one(features, {
    fields: [characterFeatures.featureId],
    references: [features.id],
  }),
}))

export default characterFeatures
