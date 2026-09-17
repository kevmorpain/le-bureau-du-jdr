import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import type { Ruleset } from '~~/shared/rules/ruleset'
import spells from './spells'
import classes from './classes'

const spellClasses = sqliteTable(
  'spell_classes',
  {
    spellId: integer('spell_id').notNull().references(() => spells.id, { onDelete: 'cascade' }),
    classId: integer('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
    ruleset: text('ruleset').$type<Ruleset>().notNull().default('5'),
  },
  table => [
    primaryKey({ columns: [table.spellId, table.classId] }),
    index('spell_classes_class_id_idx').on(table.classId),
  ],
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
