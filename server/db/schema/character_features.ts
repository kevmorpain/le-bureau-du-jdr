import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import characterSheets from './character_sheets'
import features from './features'
import type { AbilityScoreKey } from './effects'

export type CharacterFeatureSource = 'asi' | 'bonus' | 'class' | 'subclass' | 'species' | 'invocation'

// Choix enregistrés d'un don : caractéristique (demi-don, Résilient), sort de niveau 1 (Faveur des
// fées), ou maîtrises au choix (Doué → compétences + outils). Miroir de `featChoicesSchema` côté serveur.
export interface FeatChoices {
  ability?: AbilityScoreKey
  spellId?: number
  skills?: string[]
  tools?: string[]
}

const characterFeatures = sqliteTable(
  'character_features',
  {
    characterSheetId: integer('character_sheet_id').notNull().references(() => characterSheets.id, { onDelete: 'cascade' }),
    featureId: integer('feature_id').notNull().references(() => features.id, { onDelete: 'cascade' }),
    currentUses: integer('current_uses').default(0).notNull(),
    // Dérivable de `feature.featureType` sauf pour les dons (asi vs bonus MJ).
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
