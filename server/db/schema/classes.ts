import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import spellClasses from './spell_classes'

export type Die = string // e.g., "1d6", "1d8"

const classes = sqliteTable('classes', {
  id: integer().primaryKey().notNull(),
  name: text('name').notNull(),
  hitDice: text('hit_dice').$type<Die>().notNull(),
  spellcastingAbility: text('spellcasting_ability'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at'),
})

export const classesRelations = relations(classes, ({ many }) => ({
  spellClasses: many(spellClasses),
}))

export default classes
