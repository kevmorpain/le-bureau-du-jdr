import { z } from 'zod'
import type { KnCreatureType } from './catalog/creatureTypes'
import type { KnDamageType } from './catalog/damageTypes'
import { knRollDice } from './dice'
import { knDiceSchema } from './diceSchema'
import { KN_ITEM_KINDS } from './inventory'
import {
  KN_MAGIC_BOUNDS,
  knMagicPropertySchema,
  KN_MAGIC_TABLES,
  knMagicMechTemplateSchema,
  type KnMagic,
  type KnMagicMech,
  type KnMagicMechTemplate,
  type KnMagicProperty,
  type KnMagicTable,
  type KnRarity,
} from './magicSchema'
import { knRollDie, type KnRng } from './run'
import { boundedInt, knCheckCoverage } from './zodHelpers'

export const KN_MAGIC_TYPE_DIE = 8
export const KN_RARITY_DIE = 10
export const KN_MAGIC_PROPERTY_DIE = 20
export const KN_PECULIARITY_DIE = 100

export type KnMagicType = KnMagicTable | 'amulet'

// D8 : 1 Arme, 2 Armure, 3 Ceinture, 4 Bottes, 5 Gants, 6 Amulette, 7-8 Anneau.
const MAGIC_TYPES: readonly KnMagicType[] = ['weapon', 'armor', 'belt', 'boots', 'gloves', 'amulet', 'ring', 'ring']

export const knMagicTypeAt = (roll: number): KnMagicType => MAGIC_TYPES[Math.min(MAGIC_TYPES.length, Math.max(1, roll)) - 1]!

// D10 : 1-5 Peu commun (1 propriété), 6-8 Rare (2), 9-10 Épique (3).
export function knRarityAt(roll: number): KnRarity {
  if (roll <= 5) return 'uncommon'
  return roll <= 8 ? 'rare' : 'epic'
}

export const knPropertyCount = (rarity: KnRarity): number => ({ uncommon: 1, rare: 2, epic: 3 })[rarity]

// D20 des types de dégâts, dans l'ordre du livre : chaque entrée donne la dernière face du type.
const DAMAGE_TYPE_BANDS: readonly [number, KnDamageType][] = [
  [1, 'acid'], [3, 'arcane'], [5, 'bludgeoning'], [6, 'cold'], [8, 'force'], [9, 'fire'], [10, 'holy'],
  [11, 'infernal'], [12, 'lightning'], [14, 'necrotic'], [16, 'piercing'], [17, 'poison'], [18, 'psychic'], [20, 'slashing'],
]

export const knDamageTypeAt = (roll: number): KnDamageType => DAMAGE_TYPE_BANDS.find(([last]) => roll <= last)![1]

// D8 des types d'adversaire.
const ENEMY_TYPES: readonly KnCreatureType[] = ['animal', 'astral', 'plant', 'demon', 'elemental', 'undead', 'humanoid', 'construct']

export const knEnemyTypeAt = (roll: number): KnCreatureType => ENEMY_TYPES[Math.min(ENEMY_TYPES.length, Math.max(1, roll)) - 1]!

const amountOf = z.union([
  z.object({ byRarity: z.tuple([boundedInt({ min: -99, max: 99 }), boundedInt({ min: -99, max: 99 }), boundedInt({ min: -99, max: 99 })]) }),
  z.object({ dice: knDiceSchema }),
])

export const knMagicEntrySchema = z.object({
  min: boundedInt({ min: 1, max: KN_MAGIC_PROPERTY_DIE }),
  max: boundedInt({ min: 1, max: KN_MAGIC_PROPERTY_DIE }),
  // `{n}`, `{damage}` et `{enemy}` : le montant tiré ou selon la rareté, le type de dégâts et le type d'adversaire tirés.
  text: z.string().trim().min(1).max(600),
  amount: amountOf.optional(),
  roll: z.enum(['damage', 'enemy']).optional(),
  choose: z.literal('skill').optional(),
  mech: z.array(knMagicMechTemplateSchema).max(KN_MAGIC_BOUNDS.mechs).optional(),
}).refine(entry => entry.min <= entry.max, { message: 'la plage va de min à max' })

export type KnMagicEntry = z.infer<typeof knMagicEntrySchema>

const tableOf = (die: number) => z.object({
  die: z.literal(die),
  entries: z.array(knMagicEntrySchema).min(1).max(die),
}).superRefine((table, ctx) => knCheckCoverage(table.entries, die, ctx))

export const knPeculiaritySchema = z.object({
  min: boundedInt({ min: 1, max: KN_PECULIARITY_DIE }),
  max: boundedInt({ min: 1, max: KN_PECULIARITY_DIE }),
  text: z.string().trim().min(1).max(300),
  // « Choisissez-en une » : le joueur la note à la main ; « tirez deux fois » : le moteur tire deux autres résultats.
  meta: z.enum(['choose', 'twice']).optional(),
}).refine(entry => entry.min <= entry.max, { message: 'la plage va de min à max' })

// Une Relique : un objet unique, aux propriétés déjà fixées, qui n'a pas besoin d'être harmonisé. `base` : l'objet ordinaire du
// catalogue dont elle reprend les statistiques (arme, armure, bouclier).
export const knRelicSchema = z.object({
  key: z.string().regex(/^[a-z][a-zA-Z0-9]{0,39}$/),
  name: z.string().trim().min(1).max(100),
  kind: z.enum(KN_ITEM_KINDS),
  base: z.string().regex(/^[a-z][a-zA-Z0-9]{0,39}$/).optional(),
  lore: z.string().trim().max(600).optional(),
  properties: z.array(knMagicPropertySchema).min(1).max(KN_MAGIC_BOUNDS.properties),
})

export type KnRelic = z.infer<typeof knRelicSchema>

export const KN_RELIC_DIE = 20

export const knMagicContentSchema = z.object({
  tables: z.object(Object.fromEntries(KN_MAGIC_TABLES.map(key => [key, tableOf(KN_MAGIC_PROPERTY_DIE).optional()])) as Record<KnMagicTable, z.ZodOptional<ReturnType<typeof tableOf>>>),
  peculiarities: z.object({
    die: z.literal(KN_PECULIARITY_DIE),
    entries: z.array(knPeculiaritySchema).min(1).max(KN_PECULIARITY_DIE),
  }).superRefine((table, ctx) => knCheckCoverage(table.entries, KN_PECULIARITY_DIE, ctx)).optional(),
  // La table des Reliques (D20), et celles qu'on ne trouve que dans les contenants, par clé.
  relics: z.object({
    die: z.literal(KN_RELIC_DIE),
    entries: z.array(knRelicSchema.extend({ min: boundedInt({ min: 1, max: KN_RELIC_DIE }), max: boundedInt({ min: 1, max: KN_RELIC_DIE }) })).min(1).max(KN_RELIC_DIE),
  }).superRefine((table, ctx) => knCheckCoverage(table.entries, KN_RELIC_DIE, ctx)).optional(),
  containerRelics: z.array(knRelicSchema).max(20).optional(),
})

export type KnMagicContent = z.infer<typeof knMagicContentSchema>

// Les noms des types, passés par l'appelant : le moteur ne parle aucune langue.
export interface KnMagicLabels {
  damage: Record<KnDamageType, string>
  enemy: Record<KnCreatureType, string>
}

interface Context {
  n: number
  damage?: KnDamageType
  enemy?: KnCreatureType
}

const RARITY_INDEX: Record<KnRarity, 0 | 1 | 2> = { uncommon: 0, rare: 1, epic: 2 }

function fill(text: string, context: Context, labels: KnMagicLabels): string {
  return text
    .replaceAll('{n}', String(context.n))
    .replaceAll('{damage}', context.damage ? labels.damage[context.damage] : '')
    .replaceAll('{enemy}', context.enemy ? labels.enemy[context.enemy] : '')
}

function mechOf(template: KnMagicMechTemplate, context: Context): KnMagicMech | undefined {
  const num = (value: number | 'n') => value === 'n' ? context.n : value
  switch (template.k) {
    case 'modifier': return { ...template, amount: num(template.amount) }
    case 'maxVital': return { ...template, amount: num(template.amount) }
    case 'carry': return { ...template, amount: num(template.amount) }
    case 'initiative': return { ...template, amount: num(template.amount) }
    case 'speed': return { ...template, amount: num(template.amount) }
    case 'armor': return { ...template, amount: num(template.amount) }
    case 'resist': return template.damage === 'rolled' ? (context.damage ? { ...template, damage: context.damage } : undefined) : { ...template, damage: template.damage }
    case 'reduce':
      return template.damage === 'rolled' ? (context.damage ? { ...template, damage: context.damage, amount: num(template.amount) } : undefined) : { ...template, damage: template.damage, amount: num(template.amount) }
    case 'damageVs':
      return template.enemy === 'rolled' ? (context.enemy ? { ...template, enemy: context.enemy, amount: num(template.amount) } : undefined) : { ...template, enemy: template.enemy, amount: num(template.amount) }
    case 'damage': {
      const { type } = template
      if (type === 'rolled') return context.damage ? { k: 'damage', dice: template.dice, type: context.damage } : undefined
      return type ? { k: 'damage', dice: template.dice, type } : { k: 'damage', dice: template.dice }
    }
    case 'use': {
      const { heal } = template
      return { k: 'use', limit: template.limit, label: template.label, ...(heal ? { heal: { ...heal, bonus: num(heal.bonus) } } : {}), ...(template.self ? { self: true } : {}) }
    }
    default: return template
  }
}

export const knEntryAt = (table: { entries: readonly KnMagicEntry[] } | undefined, roll: number): KnMagicEntry | undefined =>
  table?.entries.find(entry => roll >= entry.min && roll <= entry.max)

// Une propriété du livre, résolue pour une rareté : le montant (selon la rareté ou tiré aux dés), les types tirés, le texte
// rempli et les mécaniques fixées.
export function knInstantiateProperty(entry: KnMagicEntry, rarity: KnRarity, labels: KnMagicLabels, rng: KnRng = Math.random): KnMagicProperty {
  const context: Context = {
    n: entry.amount ? ('byRarity' in entry.amount ? entry.amount.byRarity[RARITY_INDEX[rarity]] : knRollDice(entry.amount.dice, rng).total) : 0,
    ...(entry.roll === 'damage' ? { damage: knDamageTypeAt(knRollDie(20, rng)) } : {}),
    ...(entry.roll === 'enemy' ? { enemy: knEnemyTypeAt(knRollDie(KN_MAGIC_TYPE_DIE, rng)) } : {}),
  }
  const mech = (entry.mech ?? []).flatMap((template) => {
    const resolved = mechOf(template, context)
    return resolved ? [{ ...resolved, ...('label' in resolved ? { label: fill(resolved.label, context, labels) } : {}) } as KnMagicMech] : []
  })
  return { text: fill(entry.text, context, labels).slice(0, 600), mech, ...(entry.choose ? { choose: entry.choose } : {}) }
}

export interface KnMagicIdentification {
  rarity: KnRarity
  rolls: { rarity: number, properties: number[], peculiarities: number[] }
  magic: KnMagic
}

// Harmoniser un objet : sa rareté (D10) dit combien de propriétés tirer (D20 sur la table de son type) ; deux fois la même
// s'ajoutent. La peculiarité, facultative, se tire sur le D100 (un résultat peut en demander deux).
export function knIdentifyMagic(
  magic: KnMagic,
  content: KnMagicContent,
  labels: KnMagicLabels,
  options: { peculiarity?: boolean } = {},
  rng: KnRng = Math.random,
): KnMagicIdentification | { missing: KnMagicTable | 'relic' } {
  if (magic.table === 'relic') return { missing: 'relic' }
  const table = content.tables[magic.table]
  if (!table) return { missing: magic.table }
  const rarityRoll = knRollDie(KN_RARITY_DIE, rng)
  const rarity = knRarityAt(rarityRoll)
  const propertyRolls: number[] = []
  const properties: KnMagicProperty[] = []
  for (let i = 0; i < knPropertyCount(rarity); i++) {
    const roll = knRollDie(KN_MAGIC_PROPERTY_DIE, rng)
    const entry = knEntryAt(table, roll)
    if (!entry) return { missing: magic.table }
    propertyRolls.push(roll)
    properties.push(knInstantiateProperty(entry, rarity, labels, rng))
  }
  const peculiarityRolls: number[] = []
  const peculiarities: string[] = []
  const rollPeculiarity = () => {
    const roll = knRollDie(KN_PECULIARITY_DIE, rng)
    peculiarityRolls.push(roll)
    return content.peculiarities?.entries.find(candidate => roll >= candidate.min && roll <= candidate.max)
  }
  if (options.peculiarity && content.peculiarities) {
    const first = rollPeculiarity()
    if (first?.meta === 'twice') {
      // Un résultat qui demande deux tirages ne peut pas en redemander : on relance jusqu'à deux résultats ordinaires.
      for (let attempt = 0; attempt < 20 && peculiarities.length < KN_MAGIC_BOUNDS.peculiarities; attempt++) {
        const next = rollPeculiarity()
        if (next && !next.meta) peculiarities.push(next.text)
      }
    } else if (first) {
      peculiarities.push(first.text)
    }
  }
  return {
    rarity,
    rolls: { rarity: rarityRoll, properties: propertyRolls, peculiarities: peculiarityRolls },
    magic: { ...magic, identified: true, rarity, properties, peculiarities },
  }
}
