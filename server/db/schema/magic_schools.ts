import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

const magicSchools = sqliteTable('magic_schools', {
  id: integer().primaryKey().notNull(),
  name: text('name').notNull(),

  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  updatedAt: text('updated_at'),
  deletedAt: text('deleted_at'),
})

export default magicSchools
