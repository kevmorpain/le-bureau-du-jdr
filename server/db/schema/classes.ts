import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import type { SpellcastingType } from '~~/shared/rules/spellcasting'
import type { Ruleset } from '~~/shared/rules/ruleset'
import spellClasses from './spell_classes'

export type Die = string // e.g., "1d6", "1d8"

// Les colonnes de `classes` portent les **faits d'identité** de la classe : statiques,
// toujours vrais, ni grant ni décision (cf. rules-engine.md §3, decisions.md D3).
const classes = sqliteTable('classes', {
  id: integer().primaryKey().notNull(),
  name: text('name').notNull(),
  // Édition de règles (cf. shared/rules/ruleset.ts, decisions.md D2).
  ruleset: text('ruleset').$type<Ruleset>().notNull().default('5'),
  hitDice: text('hit_dice').$type<Die>().notNull(),
  spellcastingAbility: text('spellcasting_ability'),
  // Niveau auquel la classe accède à sa sous-classe (1 à 3 en 2014 ; 3 pour toutes
  // en 5.5). Défaut 3 = le cas majoritaire en 2014 ET la règle unique en 5.5.
  subclassLevel: integer('subclass_level').notNull().default(3),
  // Progression d'incantation de la classe (cf. shared/rules/spellcasting.ts).
  spellcastingType: text('spellcasting_type').$type<SpellcastingType>().notNull().default('none'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at'),
})

export const classesRelations = relations(classes, ({ many }) => ({
  spellClasses: many(spellClasses),
}))

export default classes
