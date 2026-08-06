import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import type { Ruleset } from '~~/shared/rules/ruleset'
import speciesFeatures from './species_features'

export enum CreatureSize {
  Tiny = 'T',
  Small = 'S',
  Medium = 'M',
  Large = 'L',
  Huge = 'H',
  Gargantuan = 'G',
}

const characterSpecies = sqliteTable('character_species', {
  id: integer().primaryKey().notNull(),
  name: text('name').notNull(),
  // Édition de règles (cf. shared/rules/ruleset.ts, decisions.md D2). En 5.5 une
  // espèce homonyme (Elfe 2024, traits seuls) coexiste avec sa version 2014.
  ruleset: text('ruleset').$type<Ruleset>().notNull().default('5'),
  size: text('size').$type<CreatureSize>().notNull(),
  speed: integer('speed').notNull(),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at'),
})

export const characterSpeciesRelations = relations(characterSpecies, ({ many }) => ({
  speciesFeatures: many(speciesFeatures),
}))

export default characterSpecies
