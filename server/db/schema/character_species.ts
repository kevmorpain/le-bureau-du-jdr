import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export enum CreatureSize {
  Tiny = 'T',
  Small = 'S',
  Medium = 'M',
  Large = 'L',
  Huge = 'H',
  Gargantuan = 'G',
}

export type Trait = {
  name: string
  description: string
  effects?: unknown
}

const characterSpecies = sqliteTable('character_species', {
  id: integer().primaryKey().notNull(),
  name: text('name').notNull(),
  size: text('size').$type<CreatureSize>().notNull(),
  speed: integer('speed').notNull(),
  traits: text('traits', { mode: 'json' }).$type<Trait[]>()
    .default(sql`(json_array())`)
    .notNull(),
})

export default characterSpecies
