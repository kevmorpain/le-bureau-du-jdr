import { z } from 'zod'
import { KN_CREATURE_TRAIT_KEYS, KN_CREATURE_TRAITS } from './catalog/creatureTraits'
import { KN_CREATURE_TYPES } from './catalog/creatureTypes'
import { KN_DAMAGE_TYPES } from './catalog/damageTypes'
import {
  KN_HIT_LOCATION_KEYS,
  KN_HIT_LOCATION_TABLE_KEYS,
  knHitLocationsOf,
  type KnHitLocationKey,
} from './catalog/hitLocations'
import { knDiceSchema, type KnDice } from './dice'
import { boundedInt } from './zodHelpers'

const slug = z.string().regex(/^[a-z][a-zA-Z0-9]{0,39}$/)

const knLocationKey = z.enum(KN_HIT_LOCATION_KEYS)

// De l'Armure sur certaines localisations, ou sur toutes (sauf celles qu'on exclut).
export const knCreatureArmorSchema = z.object({
  points: boundedInt({ min: 1, max: 9 }),
  locations: z.union([z.literal('all'), z.array(knLocationKey).min(1).max(8)]),
  except: z.array(knLocationKey).max(8).optional(),
})

export type KnCreatureArmor = z.infer<typeof knCreatureArmorSchema>

export const knCreatureActionSchema = z.object({
  min: boundedInt({ min: 1, max: 6 }),
  max: boundedInt({ min: 1, max: 6 }),
  name: z.string().trim().min(1).max(100),
  // Une action Physique se défend à l'arme ou à l'Esquive, une Magique par un test de Résistance magique du joueur.
  tag: z.enum(['physical', 'magical']).optional(),
  text: z.string().trim().min(1).max(1200),
}).refine(action => action.min <= action.max, { message: 'la plage va de min à max' })

export type KnCreatureAction = z.infer<typeof knCreatureActionSchema>

// Changements cumulatifs quand le survivant dépasse `level` (« après le niveau 5 »).
export const knLevelAdaptationSchema = z.object({
  level: boundedInt({ min: 1, max: 30 }),
  health: boundedInt({ min: 0, max: 99 }).optional(),
  combatSkill: boundedInt({ min: 0, max: 99 }).optional(),
  magicResistance: boundedInt({ min: 0, max: 99 }).optional(),
  // Dé ajouté à la réserve de dégâts des actions de la créature, ou bonus fixe (`count` 0).
  damage: knDiceSchema.optional(),
  armor: knCreatureArmorSchema.optional(),
  text: z.string().trim().min(1).max(300).optional(),
})

export type KnLevelAdaptation = z.infer<typeof knLevelAdaptationSchema>

export const knCreatureTraitSchema = z.object({
  key: z.enum(KN_CREATURE_TRAIT_KEYS),
  value: boundedInt({ min: 1, max: 9 }).optional(),
}).refine(trait => KN_CREATURE_TRAITS[trait.key].valued === (trait.value !== undefined), {
  message: 'un trait à valeur en porte une, les autres non',
})

export const knCreatureSchema = z.object({
  key: slug,
  name: z.string().trim().min(1).max(100),
  role: z.enum(['creature', 'overseer']),
  types: z.array(z.enum(KN_CREATURE_TYPES)).min(1).max(2),
  number: knDiceSchema,
  mind: boundedInt({ min: 0, max: 200 }),
  endurance: boundedInt({ min: 0, max: 200 }),
  body: boundedInt({ min: 0, max: 200 }),
  health: z.object({ base: boundedInt({ min: 1, max: 999 }), perLevel: boundedInt({ min: 1, max: 99 }).optional() }),
  // Sans localisation, la créature n'a qu'un corps et pas de point faible.
  hitLocation: z.object({ table: z.enum(KN_HIT_LOCATION_TABLE_KEYS), weakSpot: knLocationKey.optional() }).optional(),
  armor: z.array(knCreatureArmorSchema).max(4),
  combatSkill: boundedInt({ min: 0, max: 200 }),
  magicResistance: boundedInt({ min: 0, max: 200 }),
  spoils: z.string().trim().min(1).max(300),
  traits: z.array(knCreatureTraitSchema).max(8),
  affinity: z.enum(KN_DAMAGE_TYPES).optional(),
  vulnerable: z.array(z.enum(KN_DAMAGE_TYPES)).max(4).optional(),
  resistant: z.array(z.enum(KN_DAMAGE_TYPES)).max(4).optional(),
  // Résistant à tous les dégâts physiques non magiques.
  resistantPhysical: z.boolean().optional(),
  actions: z.array(knCreatureActionSchema).min(1).max(6),
  levelAdaptation: z.array(knLevelAdaptationSchema).max(4),
}).superRefine((creature, ctx) => {
  const { hitLocation } = creature
  if (hitLocation?.weakSpot && !knHitLocationsOf(hitLocation.table).includes(hitLocation.weakSpot)) {
    ctx.addIssue({ code: 'custom', path: ['hitLocation', 'weakSpot'], message: 'le point faible n\'est pas dans la table de localisation' })
  }
  let expected = 1
  creature.actions.forEach((action, index) => {
    if (action.min !== expected) ctx.addIssue({ code: 'custom', path: ['actions', index, 'min'], message: `la plage doit commencer à ${expected}` })
    expected = action.max + 1
  })
  if (expected !== 7) ctx.addIssue({ code: 'custom', path: ['actions'], message: 'les actions doivent couvrir de 1 à 6' })
})

export type KnCreature = z.infer<typeof knCreatureSchema>

export const knBestiaryContentSchema = z.array(knCreatureSchema).min(1).max(80).superRefine((creatures, ctx) => {
  const seen = new Set<string>()
  creatures.forEach((creature, index) => {
    if (seen.has(creature.key)) ctx.addIssue({ code: 'custom', path: [index, 'key'], message: `clé en double : ${creature.key}` })
    seen.add(creature.key)
  })
})

// Tirage de la rencontre : un D6 choisit la table (1-3 A, 4-6 B), puis un D20 la créature ; un D10 donne l'Overseer.
export const KN_ENCOUNTER_TABLE_DIE = 6
export const KN_ENCOUNTER_CREATURE_DIE = 20
export const KN_OVERSEER_DIE = 10

export type KnEncounterTable = 'A' | 'B'

export const knEncounterTable = (roll: number): KnEncounterTable => roll <= 3 ? 'A' : 'B'

export interface KnCreatureAtLevel {
  health: number
  combatSkill: number
  magicResistance: number
  damageBonuses: KnDice[]
  armor: KnCreatureArmor[]
  notes: string[]
}

// Le niveau du survivant, jamais celui de la créature : « après le niveau 5 » veut dire à partir du niveau 6, et les
// changements des paliers déjà dépassés s'ajoutent tous.
export function knCreatureAtLevel(creature: KnCreature, level: number): KnCreatureAtLevel {
  const steps = creature.levelAdaptation.filter(step => level > step.level)
  return {
    health: creature.health.base + (creature.health.perLevel ?? 0) * level + steps.reduce((sum, step) => sum + (step.health ?? 0), 0),
    combatSkill: creature.combatSkill + steps.reduce((sum, step) => sum + (step.combatSkill ?? 0), 0),
    magicResistance: creature.magicResistance + steps.reduce((sum, step) => sum + (step.magicResistance ?? 0), 0),
    damageBonuses: steps.flatMap(step => step.damage ? [step.damage] : []),
    armor: [...creature.armor, ...steps.flatMap(step => step.armor ? [step.armor] : [])],
    notes: steps.flatMap(step => step.text ? [step.text] : []),
  }
}

export function knArmorAt(armor: readonly KnCreatureArmor[], location: KnHitLocationKey): number {
  return armor.reduce((sum, entry) => {
    if (entry.except?.includes(location)) return sum
    return sum + (entry.locations === 'all' || entry.locations.includes(location) ? entry.points : 0)
  }, 0)
}

export const knCreatureLocations = (creature: KnCreature): KnHitLocationKey[] =>
  creature.hitLocation ? knHitLocationsOf(creature.hitLocation.table) : []

export const knFindCreature = (bestiary: readonly KnCreature[] | null | undefined, key: string | undefined): KnCreature | undefined =>
  key === undefined ? undefined : bestiary?.find(creature => creature.key === key)
