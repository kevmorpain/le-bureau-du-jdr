import { integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import features from './features'
import effects from './effects'

const featureEffects = sqliteTable(
  'feature_effects',
  {
    featureId: integer('feature_id').notNull().references(() => features.id, { onDelete: 'cascade' }),
    effectId: integer('effect_id').notNull().references(() => effects.id, { onDelete: 'cascade' }),
  },
  table => [primaryKey({ columns: [table.featureId, table.effectId] })],
)

export const featureEffectsRelations = relations(featureEffects, ({ one }) => ({
  feature: one(features, {
    fields: [featureEffects.featureId],
    references: [features.id],
  }),
  effect: one(effects, {
    fields: [featureEffects.effectId],
    references: [effects.id],
  }),
}))

export default featureEffects
