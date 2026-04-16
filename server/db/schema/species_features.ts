import { integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import characterSpecies from './character_species'
import features from './features'

const speciesFeatures = sqliteTable(
  'species_features',
  {
    speciesId: integer('species_id').notNull().references(() => characterSpecies.id, { onDelete: 'cascade' }),
    featureId: integer('feature_id').notNull().references(() => features.id, { onDelete: 'cascade' }),
  },
  table => [primaryKey({ columns: [table.speciesId, table.featureId] })],
)

export const speciesFeaturesRelations = relations(speciesFeatures, ({ one }) => ({
  species: one(characterSpecies, {
    fields: [speciesFeatures.speciesId],
    references: [characterSpecies.id],
  }),
  feature: one(features, {
    fields: [speciesFeatures.featureId],
    references: [features.id],
  }),
}))

export default speciesFeatures
