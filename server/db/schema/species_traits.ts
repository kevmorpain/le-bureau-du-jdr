import { integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import characterSpecies from './character_species'
import traits from './traits'

const speciesTraits = sqliteTable(
  'species_traits',
  {
    speciesId: integer('species_id').notNull().references(() => characterSpecies.id, { onDelete: 'cascade' }),
    traitId: integer('trait_id').notNull().references(() => traits.id, { onDelete: 'cascade' }),
  },
  table => [primaryKey({
    columns: [table.speciesId, table.traitId],
  })],
)

export const speciesTraitsRelations = relations(speciesTraits, ({ one }) => ({
  species: one(characterSpecies, {
    fields: [speciesTraits.speciesId],
    references: [characterSpecies.id],
  }),
  trait: one(traits, {
    fields: [speciesTraits.traitId],
    references: [traits.id],
  }),
}))

export default speciesTraits
