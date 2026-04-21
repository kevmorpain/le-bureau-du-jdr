import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import characterSheets from './character_sheets'

export type ProficiencyOverrideType = 'weapon' | 'armor' | 'language' | 'tool'
export type ProficiencyOverrideAction = 'grant' | 'revoke'

const characterProficiencyOverrides = sqliteTable(
  'character_proficiency_overrides',
  {
    characterSheetId: integer('character_sheet_id').notNull().references(() => characterSheets.id, { onDelete: 'cascade' }),
    proficiencyType: text('proficiency_type').$type<ProficiencyOverrideType>().notNull(),
    value: text('value').notNull(), // ex: "simple_melee", "light", "longsword"
    action: text('action').$type<ProficiencyOverrideAction>().notNull(),
  },
  table => [
    primaryKey({ columns: [table.characterSheetId, table.proficiencyType, table.value] }),
  ],
)

export const characterProficiencyOverridesRelations = relations(characterProficiencyOverrides, ({ one }) => ({
  characterSheet: one(characterSheets, {
    fields: [characterProficiencyOverrides.characterSheetId],
    references: [characterSheets.id],
  }),
}))

export default characterProficiencyOverrides
