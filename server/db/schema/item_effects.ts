import { integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import items from './items'
import effects from './effects'

const itemEffects = sqliteTable(
  'item_effects',
  {
    itemId: integer('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
    effectId: integer('effect_id').notNull().references(() => effects.id, { onDelete: 'cascade' }),
  },
  table => [primaryKey({ columns: [table.itemId, table.effectId] })],
)

export const itemEffectsRelations = relations(itemEffects, ({ one }) => ({
  item: one(items, {
    fields: [itemEffects.itemId],
    references: [items.id],
  }),
  effect: one(effects, {
    fields: [itemEffects.effectId],
    references: [effects.id],
  }),
}))

export default itemEffects
