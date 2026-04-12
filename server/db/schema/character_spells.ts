import { index, integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import characterSheets from './character_sheets'
import spells from './spells'

const characterSpells = sqliteTable(
  'character_spells',
  {
    characterSheetId: integer('character_sheet_id').notNull().references(() => characterSheets.id, { onDelete: 'cascade' }),
    spellId: integer('spell_id').notNull().references(() => spells.id, { onDelete: 'cascade' }),
    isKnown: integer('is_known', { mode: 'boolean' }).default(false).notNull(),
    isPrepared: integer('is_prepared', { mode: 'boolean' }).default(false).notNull(),
  },
  table => [
    primaryKey({ columns: [table.characterSheetId, table.spellId] }),
    index('idx_character_spells_spell').on(table.spellId),
  ],
)

export const characterSpellsRelations = relations(characterSpells, ({ one }) => ({
  characterSheet: one(characterSheets, {
    fields: [characterSpells.characterSheetId],
    references: [characterSheets.id],
  }),
  spell: one(spells, {
    fields: [characterSpells.spellId],
    references: [spells.id],
  }),
}))

export default characterSpells
