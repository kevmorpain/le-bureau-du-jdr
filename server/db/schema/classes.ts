import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import type { SpellcastingType } from '~~/shared/rules/spellcasting'
import type { Ruleset } from '~~/shared/rules/ruleset'
import type { Source } from '~~/shared/rules/source'
import spellClasses from './spell_classes'

export type Die = string // e.g., "1d6", "1d8"

const classes = sqliteTable('classes', {
  id: integer().primaryKey().notNull(),
  name: text('name').notNull(),
  ruleset: text('ruleset').$type<Ruleset>().notNull().default('5'),
  source: text('source').$type<Source>().notNull().default('core'),
  hitDice: text('hit_dice').$type<Die>().notNull(),
  spellcastingAbility: text('spellcasting_ability'),
  // Défaut 3 = le cas majoritaire en 2014 et la règle unique en 5.5.
  subclassLevel: integer('subclass_level').notNull().default(3),
  spellcastingType: text('spellcasting_type').$type<SpellcastingType>().notNull().default('none'),
  // NULL = pas de maîtrise d'armes (toutes les classes 2014). Le `count` par niveau vit sur la progression.
  weaponMasteryCount: integer('weapon_mastery_count'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at'),
})

export const classesRelations = relations(classes, ({ many }) => ({
  spellClasses: many(spellClasses),
}))

export default classes
