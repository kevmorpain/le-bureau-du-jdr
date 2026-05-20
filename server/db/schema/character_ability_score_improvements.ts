import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import characterSheets from './character_sheets'
import classes from './classes'
import type { AbilityScoreKey } from './effects'

const characterAbilityScoreImprovements = sqliteTable(
  'character_ability_score_improvements',
  {
    id: integer().primaryKey().notNull(),
    characterSheetId: integer('character_sheet_id').notNull().references(() => characterSheets.id, { onDelete: 'cascade' }),
    classId: integer('class_id').notNull().references(() => classes.id),
    classLevel: integer('class_level').notNull(),
    ability: text('ability').$type<AbilityScoreKey>().notNull(),
    amount: integer('amount').notNull(),
    createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  },
  table => [
    index('idx_asi_character').on(table.characterSheetId),
  ],
)

export const characterAbilityScoreImprovementsRelations = relations(characterAbilityScoreImprovements, ({ one }) => ({
  characterSheet: one(characterSheets, {
    fields: [characterAbilityScoreImprovements.characterSheetId],
    references: [characterSheets.id],
  }),
  class: one(classes, {
    fields: [characterAbilityScoreImprovements.classId],
    references: [classes.id],
  }),
}))

export default characterAbilityScoreImprovements
