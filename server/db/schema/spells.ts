import { index, sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { relations, sql } from 'drizzle-orm'
import type { AbilityKey } from '~~/shared/rules/abilities'
import type { DamageType } from '~~/shared/rules/damageTypes'
import type { Ruleset } from '~~/shared/rules/ruleset'
import type { Source } from '~~/shared/rules/source'
import magicSchools from './magic_schools'
import rollTables from './roll_tables'
import spellClasses from './spell_classes'

export enum SpellComponent {
  Vocal = 'V',
  Somatic = 'S',
  Material = 'M',
}

type DcSuccessEffect = string // e.g., "half", "none"

type SlotLevel = string // e.g., "1", "2", "3", etc.
type CharacterLevel = string // e.g., "1", "2", "3", etc.
type Die = string // e.g., "1d6", "2d8"

/** Un sort peut cumuler plusieurs composantes (types et/ou déclencheurs différents). */
export type DamageEntry = {
  damage_type: DamageType
  label?: string
  isSpellcastingModifierAdded?: boolean
} & (
  | { damage_at_character_level: Record<CharacterLevel, Die> }
  | { damage_at_slot_level: Record<SlotLevel, Die> }
)

/**
 * Le soin d'un sort, même forme que `DamageEntry` : une progression indexée soit par niveau de
 * PERSONNAGE (tours de magie), soit par niveau d'EMPLACEMENT (montée en puissance).
 */
export type HealEntry = {
  heal_type: 'hit_points' | 'temporary_hit_points'
  isSpellcastingModifierAdded?: boolean
} & (
  | { heal_at_character_level: Record<CharacterLevel, Die> }
  | { heal_at_slot_level: Record<SlotLevel, Die> }
)

/**
 * Sorts à plusieurs attaques indépendantes. Convention : les dés déclarés dans `damage_at_*` sont le
 * TOTAL pour toutes les attaques (per-attaque = (count/N)d(M) + (K/N)) ; les modificateurs, eux,
 * s'appliquent PAR attaque.
 */
export type MultiAttack = {
  label?: string
  count_at_character_level?: Record<CharacterLevel, number>
  count_at_slot_level?: Record<SlotLevel, number>
}

/** Attaque de SORT (jet d'attaque + bonus d'attaque de sort) ; une attaque faite avec une arme n'en est pas une. */
export type SpellAttackType = 'melee' | 'ranged'

/** `size` en mètres : rayon (sphère, cylindre, émanation), longueur (cône), arête (cube, carré). */
export type AreaOfEffect = {
  shape: 'cone' | 'sphere' | 'cube' | 'square' | 'cylinder' | 'emanation'
  size: number
  height?: number
}

/** Composante matérielle chiffrée ou consommée : le focaliseur d'incantation ne la remplace pas. `amount` reprend le chiffre de la source (« 50 po chacun » → 50). */
export type MaterialCost = {
  amount?: number
  unit?: 'pa' | 'po'
  consumed?: boolean
}

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
  materialCost: text('material_cost', { mode: 'json' })
    .$type<MaterialCost>(),
  ritual: integer('ritual', { mode: 'boolean' }).default(false).notNull(),
  duration: text('duration').notNull(),
  concentration: integer('concentration', { mode: 'boolean' }).default(false).notNull(),
  description: text('description'),

  ruleset: text('ruleset').$type<Ruleset>().notNull().default('5'),

  source: text('source').$type<Source>().notNull().default('core'),

  schoolId: integer('school_id').references(() => magicSchools.id).notNull(),

  dc: text('dc', { mode: 'json' })
    .$type<{ ability: AbilityKey, success?: DcSuccessEffect }>(),

  rollTableId: integer('roll_table_id').references(() => rollTables.id, { onDelete: 'set null' }),

  attackType: text('attack_type').$type<SpellAttackType>(),

  areaOfEffect: text('area_of_effect', { mode: 'json' })
    .$type<AreaOfEffect>(),

  damages: text('damages', { mode: 'json' })
    .$type<DamageEntry[]>(),

  heal: text('heal', { mode: 'json' })
    .$type<HealEntry>(),

  multiAttack: text('multi_attack', { mode: 'json' })
    .$type<MultiAttack>(),

  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`).notNull(),
  updatedAt: text('updated_at'),
  deletedAt: text('deleted_at'),
}, table => [
  index('idx_spells_school').on(table.schoolId),
])

export const spellsRelations = relations(spells, ({ one, many }) => ({
  school: one(magicSchools, {
    fields: [spells.schoolId],
    references: [magicSchools.id],
  }),
  spellClasses: many(spellClasses),
}))

export default spells
