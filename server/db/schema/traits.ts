import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import speciesTraits from './species_traits'
import traitEffects from './trait_effects'

const traits = sqliteTable('traits', {
  id: integer().primaryKey().notNull(),
  name: text().notNull(),
  description: text(),
})

export const traitsRelations = relations(traits, ({ many }) => ({
  traitEffects: many(traitEffects),
  speciesTraits: many(speciesTraits),
}))

export default traits
