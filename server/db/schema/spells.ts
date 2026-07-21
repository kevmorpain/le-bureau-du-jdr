import { index, sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { relations, sql } from 'drizzle-orm'
import magicSchools from './magic_schools'
import spellClasses from './spell_classes'

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

/**
 * Une composante de dégâts d'un sort. Un sort peut en cumuler plusieurs (types
 * différents et/ou déclencheurs différents), par ex. Voracité de Hadar
 * (froid à l'entrée + acide en fin de tour). Chaque entrée porte son propre type
 * et sa propre progression de dés.
 *
 * `label` (optionnel) désambiguïse une entrée quand le sort en a plusieurs
 * (ex. « à l'entrée », « en fin de tour », « cible secondaire »).
 */
export type DamageEntry = {
  damage_type: DamageType
  label?: string
  isSpellcastingModifierAdded?: boolean
} & (
  | { damage_at_character_level: Record<CharacterLevel, Die> }
  | { damage_at_slot_level: Record<SlotLevel, Die> }
)

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

  damages: text('damages', { mode: 'json' })
    .$type<DamageEntry[]>(),

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

  /**
   * Pour les sorts à plusieurs attaques indépendantes (Décharge occulte, Rayon
   * ardent, Trait magique…). Chaque "attaque" est un jet d'attaque distinct
   * (ou auto-touche pour Trait magique) ; on roule N jets séparés.
   *
   * Convention : les dés (count×Md+K) déclarés dans `damage_at_*` représentent
   * le TOTAL pour toutes les attaques. Per-attaque = (count/N)d(M) + (K/N).
   * Les modificateurs (CHA via Coup éldritique agonisant, spellcasting mod,
   * etc.) sont appliqués PAR attaque.
   *
   * - `count_at_character_level` : pour les tours de magie (cantrip) — clé = niveau du perso.
   * - `count_at_slot_level` : pour les sorts à emplacement — clé = niveau d'emplacement utilisé.
   * - `label` : nom singulier pour chaque jet ("Rayon", "Dard", "Trait"…). Défaut = "Attaque".
   */
  multiAttack: text('multi_attack', { mode: 'json' })
    .$type<{
      label?: string
      count_at_character_level?: Record<CharacterLevel, number>
      count_at_slot_level?: Record<SlotLevel, number>
    }>(),

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
