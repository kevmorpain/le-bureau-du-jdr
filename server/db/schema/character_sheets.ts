import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import characterSpecies from './character_species'
import characterClasses from './character_classes'

export enum Alignment {
  LawfulGood = 'LG',
  NeutralGood = 'NG',
  ChaoticGood = 'CG',
  LawfulNeutral = 'LN',
  TrueNeutral = 'TN',
  ChaoticNeutral = 'CN',
  LawfulEvil = 'LE',
  NeutralEvil = 'NE',
  ChaoticEvil = 'CE',
}

const characterSheets = sqliteTable('character_sheets', {
  id: integer().primaryKey().notNull(),
  name: text('name').notNull(),
  speciesId: integer('species_id').references(() => characterSpecies.id).notNull(),
  alignment: text().$type<Alignment>().default(Alignment.TrueNeutral).notNull(),
})

export const characterSheetRelations = relations(characterSheets, ({ many, one }) => ({
  species: one(characterSpecies, {
    fields: [characterSheets.speciesId],
    references: [characterSpecies.id],
  }),
  classes: many(characterClasses),
}))

export default characterSheets
