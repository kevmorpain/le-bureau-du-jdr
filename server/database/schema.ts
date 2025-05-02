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

  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
})
