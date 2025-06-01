import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { relations, sql } from 'drizzle-orm'
import magicSchools from './magic_schools'

export enum SpellComponent {
  Vocal = 'V',
  Somatic = 'S',
  Material = 'M',
}

export enum AbilityScore {
  Strength = 'str',
  Dexterity = 'dex',
  Constitution = 'con',
  Intelligence = 'int',
  Wisdom = 'wis',
  Charisma = 'cha',
}

type DcSuccessEffect = string // e.g., "half", "none"

const spells = sqliteTable('spells', {
  id: integer().primaryKey().notNull(),
  name: text('name').notNull(),
  level: integer('level').notNull(),
  castingTime: text('casting_time').notNull(),
  range: integer('range').notNull(),
  components: text('components', { mode: 'json' })
    .$type<SpellComponent[]>()
    .default(sql`(json_array())`)
    .notNull(),
  material: text('material'),
  ritual: integer('ritual', { mode: 'boolean' }).default(false).notNull(),
  duration: text('duration').notNull(),
  concentration: integer('concentration', { mode: 'boolean' }).default(false).notNull(),
  description: text('description'),

  schoolId: integer('school_id').references(() => magicSchools.id).notNull(),

  dc: text('dc', { mode: 'json' })
    .$type<{ ability: AbilityScore, success?: DcSuccessEffect }>(),

  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  updatedAt: text('updated_at'),
  deletedAt: text('deleted_at'),
})

export const spellsRelations = relations(spells, ({ one }) => ({
  school: one(magicSchools, {
    fields: [spells.schoolId],
    references: [magicSchools.id],
  }),
}))

export default spells
