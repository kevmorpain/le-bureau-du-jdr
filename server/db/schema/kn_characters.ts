import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import type { KnProvisions } from '~~/shared/ker-nethalas/camp'
import type { KnExtraSkill, KnResistances, KnSkills } from '~~/shared/ker-nethalas/character'
import type { KnRun } from '~~/shared/ker-nethalas/run'
import type { KnStatus } from '~~/shared/ker-nethalas/status'
import users from './users'

const knCharacters = sqliteTable('kn_characters', {
  id: integer().primaryKey().notNull(),
  ownerId: integer('owner_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text().notNull(),
  level: integer().default(1).notNull(),
  xp: integer().default(0).notNull(),
  personalGoals: text('personal_goals').default('').notNull(),
  healthCurrent: integer('health_current').default(0).notNull(),
  healthMax: integer('health_max').default(0).notNull(),
  toughnessCurrent: integer('toughness_current').default(0).notNull(),
  toughnessMax: integer('toughness_max').default(0).notNull(),
  aetherCurrent: integer('aether_current').default(0).notNull(),
  aetherMax: integer('aether_max').default(0).notNull(),
  sanityCurrent: integer('sanity_current').default(0).notNull(),
  sanityMax: integer('sanity_max').default(0).notNull(),
  exhaustion: integer().default(0).notNull(),
  damageModifier: integer('damage_modifier').default(0).notNull(),
  resistances: text({ mode: 'json' }).$type<KnResistances>().notNull(),
  skills: text({ mode: 'json' }).$type<KnSkills>().notNull(),
  extraSkills: text('extra_skills', { mode: 'json' }).$type<KnExtraSkill[]>().default([]).notNull(),
  status: text({ mode: 'json' }).$type<KnStatus>().notNull(),
  run: text({ mode: 'json' }).$type<KnRun>().notNull(),
  provisions: text({ mode: 'json' }).$type<KnProvisions>().notNull(),
  masteries: text().default('').notNull(),
  perks: text().default('').notNull(),
  weapons: text().default('').notNull(),
  damageAffinities: text('damage_affinities').default('').notNull(),
  equipment: text().default('').notNull(),
  notes: text().default('').notNull(),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at'),
}, table => [
  index('idx_kn_characters_owner').on(table.ownerId),
])

export default knCharacters
