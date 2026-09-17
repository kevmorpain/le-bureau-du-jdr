import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import type { Source } from '~~/shared/rules/source'
import classes from './classes'

const subclasses = sqliteTable('subclasses', {
  id: integer().primaryKey().notNull(),
  classId: integer('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  // PAS parent-gated (contrairement au ruleset) : une sous-classe d'extension peut vivre sur une classe socle.
  source: text('source').$type<Source>().notNull().default('core'),
  spellcastingAbility: text('spellcasting_ability'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at'),
})

export const subclassesRelations = relations(subclasses, ({ one }) => ({
  class: one(classes, {
    fields: [subclasses.classId],
    references: [classes.id],
  }),
}))

export default subclasses
