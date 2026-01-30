import { integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import traits from './traits'
import effects from './effects'

const traitEffects = sqliteTable(
  'trait_effects',
  {
    traitId: integer('trait_id').notNull().references(() => traits.id, { onDelete: 'cascade' }),
    effectId: integer('effect_id').notNull().references(() => effects.id, { onDelete: 'cascade' }),
  },
  table => [primaryKey({
    columns: [table.traitId, table.effectId],
  })],
)

export const traitEffectsRelations = relations(traitEffects, ({ one }) => ({
  trait: one(traits, {
    fields: [traitEffects.traitId],
    references: [traits.id],
  }),
  effect: one(effects, {
    fields: [traitEffects.effectId],
    references: [effects.id],
  }),
}))

export default traitEffects
