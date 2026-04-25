import { integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import spells from './spells'
import classes from './classes'

const spellClasses = sqliteTable(
  'spell_classes',
  {
    spellId: integer('spell_id').notNull().references(() => spells.id, { onDelete: 'cascade' }),
    classId: integer('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
  },
  table => [primaryKey({ columns: [table.spellId, table.classId] })],
)

export const spellClassesRelations = relations(spellClasses, ({ one }) => ({
  spell: one(spells, {
    fields: [spellClasses.spellId],
    references: [spells.id],
  }),
  class: one(classes, {
    fields: [spellClasses.classId],
    references: [classes.id],
  }),
}))

export default spellClasses
