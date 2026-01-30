import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import speciesTraits from './species_traits'

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
  size: text('size').$type<CreatureSize>().notNull(),
  speed: integer('speed').notNull(),
})

export const characterSpeciesRelations = relations(characterSpecies, ({ many }) => ({
  speciesTraits: many(speciesTraits),
}))

export default characterSpecies
