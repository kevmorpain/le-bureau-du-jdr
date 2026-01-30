import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

type EffectType = 'ability_increase'
  | 'ability_increase_choice'
  | 'action'
  | 'advantage'
  | 'damage_resistance'
  | 'darkvision'
  | 'equipment_penalty'
  | 'extra_damage'
  | 'immunity'
  | 'language_proficiency'
  | 'language_proficiency_choice'
  | 'other'
  | 'proficiency'
  | 'reroll'
  | 'skill_bonus'
  | 'skill_proficiency'
  | 'skill_proficiency_choice'
  | 'spell_choice'
  | 'spell_grant'
  | 'tool_proficiency'
  | 'tool_proficiency_choice'
  | 'vulnerability'
  | 'walking_speed'
  | 'weapon_proficiency'

type EffectValue = string | number | Record<string, unknown>

const effects = sqliteTable('effects', {
  id: integer().primaryKey(),
  type: text('type').$type<EffectType>().notNull(),
  value: text('value', { mode: 'json' }).$type<EffectValue | EffectValue[]>().default(sql`(json_array())`),
})

export default effects
