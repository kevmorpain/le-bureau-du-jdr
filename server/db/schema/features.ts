import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import type { Formula } from '~~/shared/utils/formula'
import classes from './classes'
import subclasses from './subclasses'
import featureEffects from './feature_effects'
import speciesFeatures from './species_features'
import characterFeatures from './character_features'

export type FeatureType = 'species_trait' | 'class_feature' | 'subclass_feature'
export type ActionType = 'action' | 'bonus_action' | 'reaction' | 'free'
export type RechargeType = 'short_rest' | 'long_rest' | 'dawn'

const features = sqliteTable('features', {
  id: integer().primaryKey().notNull(),
  name: text('name').notNull(),
  description: text('description'),
  featureType: text('feature_type').$type<FeatureType>().notNull(),
  // class/subclass features only
  classId: integer('class_id').references(() => classes.id, { onDelete: 'set null' }),
  subclassId: integer('subclass_id').references(() => subclasses.id, { onDelete: 'set null' }),
  levelRequired: integer('level_required'),
  actionType: text('action_type').$type<ActionType>(),
  maxUsesFormula: text('max_uses_formula', { mode: 'json' }).$type<Formula>(),
  rechargeType: text('recharge_type').$type<RechargeType>(),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at'),
})

export const featuresRelations = relations(features, ({ one, many }) => ({
  class: one(classes, {
    fields: [features.classId],
    references: [classes.id],
  }),
  subclass: one(subclasses, {
    fields: [features.subclassId],
    references: [subclasses.id],
  }),
  featureEffects: many(featureEffects),
  speciesFeatures: many(speciesFeatures),
  characterFeatures: many(characterFeatures),
}))

export default features
