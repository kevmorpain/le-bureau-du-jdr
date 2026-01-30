import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import characterSpecies from './character_species'
import characterClasses from './character_classes'
import characterAbilityScores from './character_ability_scores'

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

type HitDie = '4' | '6' | '8' | '10' | '12'

interface CurrentHitDie {
  die: HitDie
  count: number
}

const characterSheets = sqliteTable('character_sheets', {
  id: integer().primaryKey().notNull(),
  name: text('name').notNull(),
  speciesId: integer('species_id').references(() => characterSpecies.id).notNull(),
  alignment: text().$type<Alignment>().default(Alignment.TrueNeutral).notNull(),
  maxHp: integer('max_hp').default(0).notNull(),
  currentHp: integer('current_hp').default(0).notNull(),
  temporaryHp: integer('temporary_hp').default(0).notNull(),
  background: text().default('').notNull(),
  currentHitDie: text('current_hit_die', { mode: 'json' }).$type<CurrentHitDie[]>(),
})

export const characterSheetRelations = relations(characterSheets, ({ many, one }) => ({
  species: one(characterSpecies, {
    fields: [characterSheets.speciesId],
    references: [characterSpecies.id],
  }),
  classes: many(characterClasses),
  baseAbilityScores: many(characterAbilityScores),
}))

export default characterSheets
