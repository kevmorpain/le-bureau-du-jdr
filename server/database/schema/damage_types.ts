import { sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

const damageTypes = sqliteTable('damage_types', {
  id: text().primaryKey().notNull(),
  name: text('name').notNull(),

  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  updatedAt: text('updated_at'),
  deletedAt: text('deleted_at'),
})

export default damageTypes
