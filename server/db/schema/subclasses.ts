import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import classes from './classes'

const subclasses = sqliteTable('subclasses', {
  id: integer().primaryKey().notNull(),
  classId: integer('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
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
