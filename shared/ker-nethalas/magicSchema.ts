import { z } from 'zod'
import { KN_CONDITION_KEYS } from './catalog/conditions'
import { KN_CREATURE_TYPES } from './catalog/creatureTypes'
import { KN_DAMAGE_TYPES } from './catalog/damageTypes'
import { knDiceSchema } from './diceSchema'
import { KN_TARGET_GROUPS, KN_VITAL_KEYS } from './effects'
import { KN_RESISTANCE_KEYS, KN_SKILL_KEYS } from './skills'
import { KN_USE_LIMITS } from './status'
import { boundedInt } from './zodHelpers'

// Module feuille : `inventory.ts` l'importe, il ne doit donc rien tirer de `run` ni de `dice`.

export const KN_MAGIC_TABLES = ['weapon', 'armor', 'belt', 'boots', 'gloves', 'ring'] as const

export type KnMagicTable = (typeof KN_MAGIC_TABLES)[number]

export const KN_RARITIES = ['uncommon', 'rare', 'epic'] as const

export type KnRarity = (typeof KN_RARITIES)[number]

// Une Relique est à part : elle n'a pas besoin d'être harmonisée.
export const KN_ITEM_RARITIES = [...KN_RARITIES, 'relic'] as const

export type KnItemRarity = (typeof KN_ITEM_RARITIES)[number]

const target = z.enum([...KN_SKILL_KEYS, ...KN_RESISTANCE_KEYS, ...KN_TARGET_GROUPS])
const amount = boundedInt({ min: -99, max: 99 })
const damage = z.enum(KN_DAMAGE_TYPES)
const enemy = z.enum(KN_CREATURE_TYPES)

const piece = z.enum(['vambraces', 'greaves'])
const limit = z.enum(KN_USE_LIMITS)
const label = z.string().trim().min(1).max(100)

// Les mécaniques que le moteur sait appliquer.
export const knMagicMechSchema = z.discriminatedUnion('k', [
  z.object({ k: z.literal('modifier'), targets: z.array(target).max(8), amount }),
  z.object({ k: z.literal('advantage'), targets: z.array(target).max(8) }),
  z.object({ k: z.literal('maxVital'), vital: z.enum(KN_VITAL_KEYS), amount }),
  z.object({ k: z.literal('carry'), amount }),
  z.object({ k: z.literal('resist'), damage }),
  z.object({ k: z.literal('reduce'), damage, amount }),
  z.object({ k: z.literal('immune'), condition: z.enum(KN_CONDITION_KEYS) }),
  z.object({ k: z.literal('initiative'), amount }),
  z.object({ k: z.literal('light') }),
  z.object({ k: z.literal('damage'), dice: knDiceSchema, type: damage.optional() }),
  z.object({ k: z.literal('damageVs'), enemy, amount }),
  z.object({ k: z.literal('speed'), amount }),
  z.object({ k: z.literal('armor'), piece, amount }),
  // `heal` : les Blessures que l'usage soigne, au porteur lui-même quand `self`, sinon à une cible que le joueur désigne.
  z.object({ k: z.literal('use'), limit, label, heal: knDiceSchema.optional(), self: z.boolean().optional() }),
  // Réservées aux Reliques : un bonus de parade, une identification des potions sans test, et un objet à consommer qui augmente à
  // jamais une jauge ou une Résistance.
  z.object({ k: z.literal('parry'), amount }),
  z.object({ k: z.literal('identify') }),
  z.object({ k: z.literal('permanent'), vital: z.enum(KN_VITAL_KEYS), dice: knDiceSchema }),
  z.object({ k: z.literal('permanentResist'), resistance: z.enum(KN_RESISTANCE_KEYS), amount }),
])

export type KnMagicMech = z.infer<typeof knMagicMechSchema>

// Les mêmes, écrites pour le contenu : `n` est le montant que l'harmonisation tire (selon la rareté ou aux dés) et `rolled` le
// type tiré. Elle les résout avant de figer la mécanique sur l'objet.
const amountT = z.union([amount, z.literal('n')])
const damageT = z.union([damage, z.literal('rolled')])
const enemyT = z.union([enemy, z.literal('rolled')])

export const knMagicMechTemplateSchema = z.discriminatedUnion('k', [
  z.object({ k: z.literal('modifier'), targets: z.array(target).max(8), amount: amountT }),
  z.object({ k: z.literal('advantage'), targets: z.array(target).max(8) }),
  z.object({ k: z.literal('maxVital'), vital: z.enum(KN_VITAL_KEYS), amount: amountT }),
  z.object({ k: z.literal('carry'), amount: amountT }),
  z.object({ k: z.literal('resist'), damage: damageT }),
  z.object({ k: z.literal('reduce'), damage: damageT, amount: amountT }),
  z.object({ k: z.literal('immune'), condition: z.enum(KN_CONDITION_KEYS) }),
  z.object({ k: z.literal('initiative'), amount: amountT }),
  z.object({ k: z.literal('light') }),
  z.object({ k: z.literal('damage'), dice: knDiceSchema, type: damageT.optional() }),
  z.object({ k: z.literal('damageVs'), enemy: enemyT, amount: amountT }),
  z.object({ k: z.literal('speed'), amount: amountT }),
  z.object({ k: z.literal('armor'), piece, amount: amountT }),
  z.object({
    k: z.literal('use'),
    limit,
    label,
    heal: z.object({ count: boundedInt({ min: 0, max: 20 }), sides: boundedInt({ min: 0, max: 100 }), bonus: amountT }).optional(),
    self: z.boolean().optional(),
  }),
])

export type KnMagicMechTemplate = z.infer<typeof knMagicMechTemplateSchema>

export const KN_MAGIC_BOUNDS = {
  properties: 4,
  mechs: 6,
  peculiarities: 2,
} as const

export const knMagicPropertySchema = z.object({
  text: z.string().trim().min(1).max(600),
  mech: z.array(knMagicMechSchema).max(KN_MAGIC_BOUNDS.mechs),
  // Une compétence à choisir : tant qu'elle ne l'est pas, les modificateurs de la propriété ne s'appliquent pas.
  choose: z.literal('skill').optional(),
  choice: z.enum(KN_SKILL_KEYS).optional(),
})

export type KnMagicProperty = z.infer<typeof knMagicPropertySchema>

// Un objet magique : tant qu'il n'est pas harmonisé, il se comporte comme son équivalent ordinaire, et seul son type est
// connu. L'harmonisation tire sa rareté et ses propriétés, figées ici.
export const knMagicSchema = z.object({
  // La table de propriétés de son type, ou `relic` : une Relique porte ses propres propriétés.
  table: z.enum([...KN_MAGIC_TABLES, 'relic']),
  identified: z.boolean(),
  rarity: z.enum(KN_ITEM_RARITIES).optional(),
  properties: z.array(knMagicPropertySchema).max(KN_MAGIC_BOUNDS.properties),
  peculiarities: z.array(z.string().trim().min(1).max(300)).max(KN_MAGIC_BOUNDS.peculiarities),
})

export type KnMagic = z.infer<typeof knMagicSchema>
