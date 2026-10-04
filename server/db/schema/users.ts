import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import type { Preferences } from '~~/shared/rules/preferences'
import characterSheets from './character_sheets'

export type AuthProvider = 'discord' | 'google'

const users = sqliteTable('users', {
  id: integer().primaryKey().notNull(),
  provider: text('provider').$type<AuthProvider>().notNull(),
  providerUserId: text('provider_user_id').notNull(),
  email: text('email'),
  name: text('name').notNull(),
  avatar: text('avatar'),
  // Défauts du joueur, hérités par les fiches qui n'ont rien tranché (D18).
  preferences: text('preferences', { mode: 'json' }).$type<Preferences>(),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
}, table => [
  // Identité v1 : un compte par couple (provider, providerUserId).
  uniqueIndex('idx_users_provider_identity').on(table.provider, table.providerUserId),
])

export const usersRelations = relations(users, ({ many }) => ({
  characterSheets: many(characterSheets),
}))

export default users
