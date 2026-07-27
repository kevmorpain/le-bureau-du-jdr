import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import characterSheets from './character_sheets'

type SlotType = 'spellcasting' | 'pact_magic'

const characterSpellSlots = sqliteTable(
  'character_spell_slots',
  {
    characterSheetId: integer('character_sheet_id').notNull().references(() => characterSheets.id, { onDelete: 'cascade' }),
    slotLevel: integer('slot_level').notNull(),
    slotType: text('slot_type').$type<SlotType>().notNull(),
    total: integer('total').default(0).notNull(),
    used: integer('used').default(0).notNull(),
  },
  table => [primaryKey({
    columns: [table.characterSheetId, table.slotLevel, table.slotType],
  })],
)

export const characterSpellSlotsRelations = relations(characterSpellSlots, ({ one }) => ({
  characterSheet: one(characterSheets, {
    fields: [characterSpellSlots.characterSheetId],
    references: [characterSheets.id],
  }),
}))

export default characterSpellSlots
