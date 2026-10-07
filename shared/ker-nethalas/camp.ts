import { z } from 'zod'
import { KN_USAGE_DICE, knRollDie, type KnDomain, type KnRng, type KnUsageDie } from './run'
import { boundedInt, shapeOf } from './zodHelpers'

export const KN_PROVISION_KEYS = [
  'rations',
  'bandages',
  'craftingSupplies',
  'cookingIngredients',
  'lampOil',
  'lockpicks',
  'torches',
  'attunementCrystals',
] as const

export type KnProvisionKey = (typeof KN_PROVISION_KEYS)[number]

export const KN_PROVISION_BOUNDS = { min: 0, max: 999 } as const

export const knProvisionsSchema = z.object(shapeOf(KN_PROVISION_KEYS, boundedInt(KN_PROVISION_BOUNDS)))

export type KnProvisions = z.infer<typeof knProvisionsSchema>

export const emptyKnProvisions = (): KnProvisions =>
  Object.fromEntries(KN_PROVISION_KEYS.map(key => [key, 0])) as KnProvisions

const heal = (current: number, amount: number, max: number) => Math.max(current, Math.min(max, current + amount))

export const knLowerDie = (die: KnUsageDie): KnUsageDie => KN_USAGE_DICE[KN_USAGE_DICE.indexOf(die) + 1] ?? die

export const KN_BREATHER = { toughnessDie: 10, toughnessBonus: 2, health: 1, exhaustion: 2, light: 5 } as const

export interface KnBreatherInput {
  toughness: number
  toughnessMax: number
  health: number
  healthMax: number
  exhaustion: number
  lightRemaining: number
  tensionDie: KnUsageDie
}

export interface KnBreatherResult extends Omit<KnBreatherInput, 'toughnessMax' | 'healthMax'> {
  toughnessRoll: number
}

// Au D4, le dé reste : le livre ne dit pas qu'un cran de plus déclenche la procédure, qui n'a lieu que sur un jet.
export function knTakeBreather(input: KnBreatherInput, rng: KnRng = Math.random): KnBreatherResult {
  const toughnessRoll = knRollDie(KN_BREATHER.toughnessDie, rng)
  return {
    toughness: heal(input.toughness, toughnessRoll + KN_BREATHER.toughnessBonus, input.toughnessMax),
    health: heal(input.health, KN_BREATHER.health, input.healthMax),
    exhaustion: Math.max(0, input.exhaustion - KN_BREATHER.exhaustion),
    lightRemaining: Math.max(0, input.lightRemaining - KN_BREATHER.light),
    tensionDie: knLowerDie(input.tensionDie),
    toughnessRoll,
  }
}

export const KN_CAMP_ACTIVITY_KEYS = [
  'attune',
  'barricade',
  'cooking',
  'bandages',
  'lampOil',
  'lockpicks',
  'torches',
  'healConditions',
  'repair',
] as const

export type KnCampActivityKey = (typeof KN_CAMP_ACTIVITY_KEYS)[number]

export const KN_CAMP_QUANTITY_MAX = 99

export const KN_CAMP_CHECK = { die: 20, target: 12 } as const
export const KN_CAMP_SLEEP = { exhaustion: 5, health: 1, check: 2 } as const
export const KN_CAMP_BENEFITS = { exhaustion: 10, health: 1, sanityDie: 4, rotHealthDie: 4 } as const
export const KN_CAMP_ROT_HEALTH_STAGE = 5

type ProvisionDelta = Partial<Record<KnProvisionKey, number>>

interface KnCampActivityDef {
  exhaustion: (count: number) => number
  check: (count: number) => number
  consumes: (count: number) => ProvisionDelta
  produces: (count: number) => ProvisionDelta
}

// Fabriquer et réparer coûtent une fois, quelle que soit la quantité ; barricader, harmoniser et soigner coûtent par unité.
const once = (count: number, amount: number) => count > 0 ? amount : 0
const none = () => ({})

export const KN_CAMP_ACTIVITIES: Record<KnCampActivityKey, KnCampActivityDef> = {
  attune: {
    exhaustion: count => count,
    check: () => 0,
    consumes: count => ({ attunementCrystals: count }),
    produces: none,
  },
  barricade: {
    exhaustion: count => count,
    check: count => 5 * count,
    consumes: count => ({ craftingSupplies: count }),
    produces: none,
  },
  cooking: {
    exhaustion: count => once(count, 1),
    check: count => once(count, -1),
    consumes: count => ({ cookingIngredients: count }),
    produces: count => ({ rations: count }),
  },
  bandages: {
    exhaustion: count => once(count, 1),
    check: count => once(count, -1),
    consumes: count => ({ craftingSupplies: count }),
    produces: count => ({ bandages: count }),
  },
  lampOil: {
    exhaustion: count => once(count, 1),
    check: count => once(count, -2),
    consumes: count => ({ craftingSupplies: 2 * count }),
    produces: count => ({ lampOil: count }),
  },
  lockpicks: {
    exhaustion: count => once(count, 1),
    check: count => once(count, -2),
    consumes: count => ({ craftingSupplies: count }),
    produces: count => ({ lockpicks: count }),
  },
  torches: {
    exhaustion: count => once(count, 1),
    check: count => once(count, -2),
    consumes: count => ({ craftingSupplies: count }),
    produces: count => ({ torches: count }),
  },
  healConditions: {
    exhaustion: count => count,
    check: () => 0,
    consumes: count => ({ bandages: count }),
    produces: none,
  },
  repair: {
    exhaustion: count => once(count, 2),
    check: count => once(count, -2),
    consumes: count => ({ craftingSupplies: 2 * count }),
    produces: none,
  },
}

export interface KnCampPlan {
  activities: Record<KnCampActivityKey, number>
  sleep: boolean
  modifier: number
}

export const emptyKnCampPlan = (): KnCampPlan => ({
  activities: Object.fromEntries(KN_CAMP_ACTIVITY_KEYS.map(key => [key, 0])) as Record<KnCampActivityKey, number>,
  sleep: false,
  modifier: 0,
})

export interface KnCampContext {
  provisions: KnProvisions
  // Nombre d'événements « mains tremblantes » actifs : chacun retire 1 au test de Camp.
  checkPenalty: number
  attuneBlocked: boolean
}

export const knCampContext = (provisions: KnProvisions, domain: KnDomain): KnCampContext => ({
  provisions,
  checkPenalty: domain.growingDarkness.filter(event => event.key === 'gd_17_18').length,
  attuneBlocked: domain.growingDarkness.some(event => event.key === 'gd_19_20'),
})

export type KnCampIssue
  = | { type: 'shortage', key: KnProvisionKey, missing: number }
    | { type: 'sleepExclusive' }
    | { type: 'attuneBlocked' }

export interface KnCampPreview {
  exhaustionCost: number
  checkModifier: number
  hasRation: boolean
  provisions: KnProvisions
  issues: KnCampIssue[]
}

export function knPreviewCamp(plan: KnCampPlan, context: KnCampContext): KnCampPreview {
  const provisions = { ...context.provisions }
  let exhaustionCost = 0
  let checkModifier = plan.modifier - context.checkPenalty + (plan.sleep ? KN_CAMP_SLEEP.check : 0)

  for (const key of KN_CAMP_ACTIVITY_KEYS) {
    const count = plan.activities[key]
    const def = KN_CAMP_ACTIVITIES[key]
    exhaustionCost += def.exhaustion(count)
    checkModifier += def.check(count)
    for (const [item, amount] of Object.entries(def.consumes(count)) as [KnProvisionKey, number][]) provisions[item] -= amount
    for (const [item, amount] of Object.entries(def.produces(count)) as [KnProvisionKey, number][]) provisions[item] += amount
  }

  const issues: KnCampIssue[] = []
  for (const key of KN_PROVISION_KEYS) {
    if (provisions[key] < 0) issues.push({ type: 'shortage', key, missing: -provisions[key] })
  }
  if (plan.sleep && KN_CAMP_ACTIVITY_KEYS.some(key => key !== 'barricade' && plan.activities[key] > 0)) {
    issues.push({ type: 'sleepExclusive' })
  }
  if (context.attuneBlocked && plan.activities.attune > 0) issues.push({ type: 'attuneBlocked' })

  const hasRation = provisions.rations >= 1
  if (hasRation) provisions.rations -= 1

  return { exhaustionCost, checkModifier, hasRation, provisions, issues }
}

export interface KnCampState {
  toughness: number
  toughnessMax: number
  health: number
  healthMax: number
  sanity: number
  sanityMax: number
  exhaustion: number
  rotStage: number
}

export interface KnCampOutcome {
  total: number
  success: boolean
  halved: boolean
  hasRation: boolean
  state: Pick<KnCampState, 'toughness' | 'health' | 'sanity' | 'exhaustion'>
  provisions: KnProvisions
  gains: { toughness: number, health: number, sanity: number, exhaustion: number }
  rotHealthRoll?: number
  sanityRoll: number
}

// Sans Ration, ou après un test raté, les bénéfices du camp sont réduits de moitié (arrondi à l'inférieur).
// Les effets de l'activité Dormir ne sont pas des bénéfices du camp : ils ne sont pas réduits.
export function knFinishCamp(
  plan: KnCampPlan,
  state: KnCampState,
  context: KnCampContext,
  roll: number,
  rng: KnRng = Math.random,
): KnCampOutcome | null {
  const preview = knPreviewCamp(plan, context)
  if (preview.issues.length) return null

  const total = roll + preview.checkModifier
  const success = total >= KN_CAMP_CHECK.target
  const halved = !success || !preview.hasRation
  const half = (amount: number) => halved ? Math.floor(amount / 2) : amount

  const sanityRoll = knRollDie(KN_CAMP_BENEFITS.sanityDie, rng)
  const rotHealthRoll = state.rotStage >= KN_CAMP_ROT_HEALTH_STAGE ? knRollDie(KN_CAMP_BENEFITS.rotHealthDie, rng) : undefined

  const toughness = Math.max(state.toughness, half(Math.max(0, state.toughnessMax - state.toughness)) + state.toughness)
  const healthGain = half(KN_CAMP_BENEFITS.health) + (rotHealthRoll === undefined ? 0 : half(rotHealthRoll)) + (plan.sleep ? KN_CAMP_SLEEP.health : 0)
  const health = heal(state.health, healthGain, state.healthMax)
  const sanity = heal(state.sanity, half(sanityRoll), state.sanityMax)
  const exhaustion = Math.max(
    0,
    state.exhaustion + preview.exhaustionCost - half(KN_CAMP_BENEFITS.exhaustion) - (plan.sleep ? KN_CAMP_SLEEP.exhaustion : 0),
  )

  return {
    total,
    success,
    halved,
    hasRation: preview.hasRation,
    state: { toughness, health, sanity, exhaustion },
    provisions: preview.provisions,
    gains: {
      toughness: toughness - state.toughness,
      health: health - state.health,
      sanity: sanity - state.sanity,
      exhaustion: exhaustion - state.exhaustion,
    },
    rotHealthRoll,
    sanityRoll,
  }
}
