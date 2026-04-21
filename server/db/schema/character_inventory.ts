import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import type { Effect } from './effects'
import characterSheets from './character_sheets'
import items from './items'

const characterInventory = sqliteTable(
  'character_inventory',
  {
    id: integer().primaryKey().notNull(),
    characterSheetId: integer('character_sheet_id').notNull().references(() => characterSheets.id, { onDelete: 'cascade' }),
    itemId: integer('item_id').notNull().references(() => items.id),
    quantity: integer('quantity').default(1).notNull(),
    equipped: integer('equipped', { mode: 'boolean' }).default(false).notNull(),
    magicBonus: integer('magic_bonus').default(0).notNull(),
    magicEffects: text('magic_effects', { mode: 'json' }).$type<Effect[]>(),
    notes: text('notes'),
  },
  table => [
    index('idx_character_inventory_sheet').on(table.characterSheetId),
    index('idx_character_inventory_item').on(table.itemId),
  ],
)

export const characterInventoryRelations = relations(characterInventory, ({ one }) => ({
  characterSheet: one(characterSheets, {
    fields: [characterInventory.characterSheetId],
    references: [characterSheets.id],
  }),
  item: one(items, {
    fields: [characterInventory.itemId],
    references: [items.id],
  }),
}))

export default characterInventory
