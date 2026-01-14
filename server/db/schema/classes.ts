import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export type Die = string // e.g., "1d6", "1d8"

const classes = sqliteTable('classes', {
  id: integer().primaryKey().notNull(),
  name: text('name').notNull(),
  hitDice: text('hit_dice').$type<Die>().notNull(),
})

export default classes
