import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import characterSheets from './character_sheets'
import abilityScores from './ability_scores'
import { relations } from 'drizzle-orm'

const characterAbilityScores = sqliteTable(
  'character_ability_scores',
  {
    characterSheetId: integer('character_sheet_id').notNull().references(() => characterSheets.id, { onDelete: 'cascade' }),
    abilityId: text('ability_id').notNull().references(() => abilityScores.id, { onDelete: 'cascade' }),
    value: integer('value').notNull(),
  },
  table => [primaryKey({
    columns: [table.characterSheetId, table.abilityId],
  })],
)

export const characterAbilityScoreRelations = relations(characterAbilityScores, ({ one }) => ({
  characterSheet: one(characterSheets, {
    fields: [characterAbilityScores.characterSheetId],
    references: [characterSheets.id],
  }),
  ability: one(abilityScores, {
    fields: [characterAbilityScores.abilityId],
    references: [abilityScores.id],
  }),
}))

export default characterAbilityScores
