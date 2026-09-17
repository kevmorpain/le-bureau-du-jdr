import { sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// Projection seedée de la const canonique `shared/rules/skills.ts`, qui fait foi.
const skills = sqliteTable('skills', {
  id: text().primaryKey().notNull(),
  ability: text('ability').notNull(),

  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  updatedAt: text('updated_at'),
  deletedAt: text('deleted_at'),
})

export default skills
