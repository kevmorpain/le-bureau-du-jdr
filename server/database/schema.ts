import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const spells = sqliteTable('spells', {
  id: integer().primaryKey().notNull(),
  name: text('name').notNull(),
  level: integer('level').notNull(),
  castingTime: text('casting_time').notNull(),
  range: integer('range').notNull(),
  components: text('components'),
  duration: text('duration').notNull(),
  description: text('description'),

  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  updatedAt: text('updated_at'),
  deletedAt: text('deleted_at'),
})
