import { sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// Table de référence des 18 compétences (cf. decisions.md D7). Projection seedée de
// la const canonique `shared/rules/skills.ts` (seed `skills`) — la const fait foi.
// `id` = clé machine snake_case (identique à `character_skills.skill_key`, à l'i18n et
// aux effets). `ability` = caractéristique associée (réf. conceptuelle vers
// `ability_scores.id`). Libellés → i18n (D11).
const skills = sqliteTable('skills', {
  id: text().primaryKey().notNull(),
  ability: text('ability').notNull(),

  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  updatedAt: text('updated_at'),
  deletedAt: text('deleted_at'),
})

export default skills
