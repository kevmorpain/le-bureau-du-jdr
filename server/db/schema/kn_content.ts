import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

const knContent = sqliteTable('kn_content', {
  name: text().primaryKey().notNull(),
  data: text({ mode: 'json' }).$type<unknown>().notNull(),
  updatedAt: text('updated_at').notNull(),
})

export default knContent
