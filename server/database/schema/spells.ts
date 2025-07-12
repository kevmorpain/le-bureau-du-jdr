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

export enum DamageType {
  Acid = 'acid',
  Bludgeoning = 'bludgeoning',
  Cold = 'cold',
  Fire = 'fire',
  Force = 'force',
  Lightning = 'lightning',
  Necrotic = 'necrotic',
  Piercing = 'piercing',
  Poison = 'poison',
  Psychic = 'psychic',
  Radiant = 'radiant',
  Slashing = 'slashing',
  Thunder = 'thunder',
}

type DcSuccessEffect = string // e.g., "half", "none"

type SlotLevel = string // e.g., "1", "2", "3", etc.
type CharacterLevel = string // e.g., "1", "2", "3", etc.
type Die = string // e.g., "1d6", "2d8"

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

  damage: text('damage', { mode: 'json' })
    .$type<{
      damage_type: DamageType
      damage_at_character_level: Record<CharacterLevel, Die>
    } | {
      damage_type: DamageType
      damage_at_slot_level: Record<SlotLevel, Die>
    }>(),

  heal: text('heal', { mode: 'json' })
    .$type<{
      heal_type: 'hit_points' | 'temporary_hit_points'
      heal_at_character_level: Record<CharacterLevel, Die>
      isSpellcastingModifierAdded?: boolean
    } | {
      heal_type: 'hit_points' | 'temporary_hit_points'
      heal_at_slot_level: Record<SlotLevel, Die>
      isSpellcastingModifierAdded?: boolean
    }>(),

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
