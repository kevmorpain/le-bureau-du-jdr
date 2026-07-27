import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import characterSheets from './character_sheets'

type ProficiencyLevel = 'none' | 'proficient' | 'expert'
type ProficiencySource = 'class' | 'species' | 'background' | 'feat' | 'manual'

const characterSkills = sqliteTable(
  'character_skills',
  {
    characterSheetId: integer('character_sheet_id').notNull().references(() => characterSheets.id, { onDelete: 'cascade' }),
    skillKey: text('skill_key').notNull(), // 'athletics', 'acrobatics', etc. (clés i18n)
    proficiencyLevel: text('proficiency_level').$type<ProficiencyLevel>().default('none').notNull(),
    source: text('source').$type<ProficiencySource>().notNull(),
    isOverride: integer('is_override', { mode: 'boolean' }).default(false).notNull(),
  },
  table => [
    primaryKey({ columns: [table.characterSheetId, table.skillKey, table.source] }),
    index('idx_character_skills_sheet').on(table.characterSheetId),
  ],
)

export const characterSkillsRelations = relations(characterSkills, ({ one }) => ({
  characterSheet: one(characterSheets, {
    fields: [characterSkills.characterSheetId],
    references: [characterSheets.id],
  }),
}))

export default characterSkills
