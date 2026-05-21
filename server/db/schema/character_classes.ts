import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import characterSheets from './character_sheets'
import classes from './classes'
import subclasses from './subclasses'
import { relations } from 'drizzle-orm'

const characterClasses = sqliteTable(
  'character_classes',
  {
    characterSheetId: integer('character_sheet_id').notNull().references(() => characterSheets.id, { onDelete: 'cascade' }),
    classId: integer('class_id').notNull().references(() => classes.id, { onDelete: 'cascade' }),
    level: integer('level').default(1).notNull(),
    isMain: integer('is_main', { mode: 'boolean' }).default(false).notNull(),
    subclassId: integer('subclass_id').references(() => subclasses.id, { onDelete: 'set null' }),
    pactBoon: text('pact_boon').$type<'chain' | 'blade' | 'tome'>(),
  },
  table => [
    primaryKey({ columns: [table.characterSheetId, table.classId] }),
    index('character_classes_class_id_idx').on(table.classId),
  ],
)

export const characterClassRelations = relations(characterClasses, ({ one }) => ({
  characterSheet: one(characterSheets, {
    fields: [characterClasses.characterSheetId],
    references: [characterSheets.id],
  }),
  class: one(classes, {
    fields: [characterClasses.classId],
    references: [classes.id],
  }),
  subclass: one(subclasses, {
    fields: [characterClasses.subclassId],
    references: [subclasses.id],
  }),
}))

export default characterClasses
