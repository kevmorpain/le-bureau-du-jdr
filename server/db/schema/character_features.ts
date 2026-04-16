import { integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import characterSheets from './character_sheets'
import features from './features'

const characterFeatures = sqliteTable(
  'character_features',
  {
    characterSheetId: integer('character_sheet_id').notNull().references(() => characterSheets.id, { onDelete: 'cascade' }),
    featureId: integer('feature_id').notNull().references(() => features.id, { onDelete: 'cascade' }),
    currentUses: integer('current_uses').default(0).notNull(),
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
