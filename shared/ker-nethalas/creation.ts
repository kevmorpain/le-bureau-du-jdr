import { z } from 'zod'
import { emptyKnProvisions } from './camp'
import { defaultKnResistances, defaultKnSkills, type KnResistances, type KnSkills } from './character'
import { KN_MAX_ACTIVE_GOALS, knNewGoalPick } from './goals'
import { knInventorySchema, knNextItemId, knPlaceItem, knPlacesFor, type KnItem } from './inventory'
import { knItemFromCatalog, type KnCatalogItem } from './items'
import { KN_MAX_TRAINED_MASTERIES } from './masteries'
import { knRollDie, type KnRng } from './run'
import { KN_RESISTANCE_KEYS, KN_SKILL_KEYS, KN_WEAPON_SKILL_KEYS, type KnSkillKey } from './skills'
import { boundedInt } from './zodHelpers'

export const KN_CREATION_VITALS = {
  health: { dice: 1, sides: 6, bonus: 10 },
  toughness: { dice: 3, sides: 6, bonus: 20 },
  aether: { dice: 1, sides: 6, bonus: 8 },
  sanity: { dice: 1, sides: 6, bonus: 10 },
} as const

export type KnCreationVital = keyof typeof KN_CREATION_VITALS

export const KN_CREATION_VITAL_KEYS = Object.keys(KN_CREATION_VITALS) as KnCreationVital[]

export function knVitalRange(vital: KnCreationVital) {
  const { dice, sides, bonus } = KN_CREATION_VITALS[vital]
  return { min: dice + bonus, max: dice * sides + bonus }
}

export function knRollStartingVital(vital: KnCreationVital, rng: KnRng = Math.random): number {
  const { dice, sides, bonus } = KN_CREATION_VITALS[vital]
  let total = bonus
  for (let i = 0; i < dice; i++) total += knRollDie(sides, rng)
  return total
}

// Une enveloppe par compétence, jamais deux : +60 puis +40 sur des compétences d'arme, puis 3×30, 2×20 et 3×10.
export const KN_ALLOTMENT_COUNTS = { 60: 1, 40: 1, 30: 3, 20: 2, 10: 3 } as const

export type KnAllotment = keyof typeof KN_ALLOTMENT_COUNTS

export const KN_ALLOTMENT_VALUES = [60, 40, 30, 20, 10] as const satisfies readonly KnAllotment[]

export type KnAllotments = Partial<Record<KnSkillKey, KnAllotment>>

const WEAPON_KEYS: readonly string[] = KN_WEAPON_SKILL_KEYS

export function knAllotmentIssues(allotments: KnAllotments): string[] {
  const issues: string[] = []
  const entries = Object.entries(allotments) as [KnSkillKey, KnAllotment][]

  for (const value of KN_ALLOTMENT_VALUES) {
    const assigned = entries.filter(([, v]) => v === value)
    const expected = KN_ALLOTMENT_COUNTS[value]
    if (assigned.length !== expected) issues.push(`+${value} : ${assigned.length} compétence(s) choisie(s) sur ${expected}`)
    if ((value === 60 || value === 40) && assigned.some(([key]) => !WEAPON_KEYS.includes(key))) {
      issues.push(`+${value} : doit aller à une compétence d'arme`)
    }
  }
  return issues
}

export function knCreationSkills(allotments: KnAllotments): KnSkills {
  const skills = defaultKnSkills()
  for (const key of KN_SKILL_KEYS) skills[key].score += allotments[key] ?? 0
  return skills
}

// 40 dans une Résistance au choix, 20 dans les deux autres.
export function knCreationResistances(boosted: (typeof KN_RESISTANCE_KEYS)[number]): KnResistances {
  const resistances = defaultKnResistances()
  resistances[boosted] = 40
  return resistances
}

export const KN_CREATION_KIT = {
  cookingIngredients: { min: 1, max: 10 },
  craftingSupplies: { min: 6, max: 15 },
  coins: { min: 1, max: 20 },
  torches: 1,
} as const

export function knRollStartingKit(rng: KnRng = Math.random) {
  return {
    cookingIngredients: knRollDie(10, rng),
    craftingSupplies: knRollDie(10, rng) + 5,
    coins: knRollDie(20, rng),
  }
}

const KN_KIT_MAX_ITEMS = 2

const ARMOR_KINDS: readonly KnItem['kind'][] = ['torso', 'vambraces', 'greaves', 'helmet', 'shield']

// L'arme choisie, portée en main, et la pièce d'armure tirée, portée sur le corps : des exemplaires neufs du catalogue.
export function knStartingKitItems(catalog: readonly KnCatalogItem[], pick: { weapon?: string | null, armor?: string | null }): KnItem[] {
  let items: KnItem[] = []
  for (const key of [pick.weapon, pick.armor]) {
    const entry = key ? catalog.find(candidate => candidate.key === key) : undefined
    if (!entry || entry.provision) continue
    const id = knNextItemId(items)
    items = [...items, knItemFromCatalog(entry, id)]
    const place = knPlacesFor(entry.kind).find(candidate => candidate !== 'bag' && candidate !== 'quick')
    if (!place) continue
    const placed = knPlaceItem(items, id, place)
    if ('items' in placed) items = placed.items
  }
  return items
}

const vitalSchema = (vital: KnCreationVital) => boundedInt(knVitalRange(vital))

const allotmentSchema = z.union([z.literal(60), z.literal(40), z.literal(30), z.literal(20), z.literal(10)])

export const knCreationSchema = z.object({
  name: z.string().trim().min(1).max(100),
  appearance: z.string().max(2000).default(''),
  // Où chaque Maîtrise a été apprise (tirage D6 de l'assistant), à part de l'apparence.
  training: z.string().max(2000).default(''),
  vitals: z.object({
    health: vitalSchema('health'),
    toughness: vitalSchema('toughness'),
    aether: vitalSchema('aether'),
    sanity: vitalSchema('sanity'),
  }),
  allotments: z.record(z.enum(KN_SKILL_KEYS), allotmentSchema).superRefine((allotments, ctx) => {
    for (const message of knAllotmentIssues(allotments)) ctx.addIssue({ code: 'custom', message })
  }),
  resistanceBoost: z.enum(KN_RESISTANCE_KEYS),
  // Clés des Maîtrises choisies : leur validité dépend du contenu chargé, vérifiée par `knMasteryPickIssues`.
  masteries: z.array(z.string().max(40)).max(KN_MAX_TRAINED_MASTERIES).default([]),
  // Clés des objectifs personnels choisis, vérifiées comme les Maîtrises par `knGoalPickIssues`.
  goals: z.array(z.string().max(40)).max(KN_MAX_ACTIVE_GOALS).default([]),
  // Équipement des runs suivants ; `null` pour une première partie, qui trouve son équipement dans le Domaine d'introduction.
  kit: z.object({
    weapon: z.string().max(200),
    armor: z.string().max(200),
    cookingIngredients: boundedInt(KN_CREATION_KIT.cookingIngredients),
    craftingSupplies: boundedInt(KN_CREATION_KIT.craftingSupplies),
    coins: boundedInt(KN_CREATION_KIT.coins),
    // L'arme et l'armure du kit, quand le catalogue du livre est chargé : elles entrent dans l'inventaire, portées, et leur
    // texte libre ci-dessus n'est alors pas repris.
    items: knInventorySchema.refine(items => items.length <= KN_KIT_MAX_ITEMS, { message: 'le kit ne compte qu\'une arme et une armure' }).default([]),
  }).nullable(),
})

export type KnCreation = z.infer<typeof knCreationSchema>

// La fiche complète d'un survivant qui vient d'être créé, calculée par le serveur à partir des seuls choix du joueur.
export function knBuildCreatedSheet(creation: KnCreation) {
  const { vitals, kit } = creation
  return {
    name: creation.name,
    appearance: creation.appearance,
    training: creation.training,
    goalPicks: creation.goals.map(knNewGoalPick),
    healthCurrent: vitals.health,
    healthMax: vitals.health,
    toughnessCurrent: vitals.toughness,
    toughnessMax: vitals.toughness,
    aetherCurrent: vitals.aether,
    aetherMax: vitals.aether,
    sanityCurrent: vitals.sanity,
    sanityMax: vitals.sanity,
    exhaustion: 0,
    skills: knCreationSkills(creation.allotments),
    resistances: knCreationResistances(creation.resistanceBoost),
    masteryPicks: creation.masteries.map(key => ({ key, tiers: 1 })),
    weapons: kit && !kit.items.some(item => item.kind === 'weapon') ? kit.weapon : '',
    equipment: kit?.armor && !kit.items.some(item => ARMOR_KINDS.includes(item.kind)) ? `Armure : ${kit.armor}` : '',
    inventory: kit?.items ?? [],
    provisions: kit
      ? { ...emptyKnProvisions(), torches: KN_CREATION_KIT.torches, cookingIngredients: kit.cookingIngredients, craftingSupplies: kit.craftingSupplies }
      : emptyKnProvisions(),
    coins: kit?.coins ?? 0,
  }
}
