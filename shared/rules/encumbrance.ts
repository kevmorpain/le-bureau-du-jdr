import type { CreatureSizeCode } from './creatureSize'
import { COIN_WEIGHT_G } from './currency'

export const CAPACITY_PER_STRENGTH_G = 7500
export const ENCUMBERED_PER_STRENGTH_G = 2500
export const HEAVILY_ENCUMBERED_PER_STRENGTH_G = 5000

// Chaque catégorie de taille au-delà de Moyenne double la capacité de charge, la taille Très petite la divise par deux.
export const SIZE_CAPACITY_FACTOR: Record<CreatureSizeCode, number> = { T: 0.5, S: 1, M: 1, L: 2, H: 4, G: 8 }

export type EncumbranceLevel = 'none' | 'encumbered' | 'heavily' | 'overloaded'

export const ENCUMBERED_SPEED_PENALTY = 3
export const HEAVILY_ENCUMBERED_SPEED_PENALTY = 6

export interface WeightedStack {
  quantity: number
  weightG: number | null
  lotSize: number
  carried: boolean
}

// Les montures et les véhicules d'une fiche se tirent ou se chevauchent, ils ne se portent pas.
const UNCARRIED_CATEGORIES: readonly string[] = ['Monture', 'Véhicule']

export const isCarried = (itemType: string, category: string | undefined): boolean =>
  !(itemType === 'equipment' && category !== undefined && UNCARRIED_CATEGORIES.includes(category))

export const stackWeightG = (stack: WeightedStack): number =>
  stack.carried && stack.weightG ? stack.quantity * stack.weightG / Math.max(1, stack.lotSize) : 0

export const carriedWeightG = (stacks: readonly WeightedStack[], coins: number): number =>
  Math.round(stacks.reduce((sum, stack) => sum + stackWeightG(stack), 0) + coins * COIN_WEIGHT_G)

export const carryingCapacityG = (strength: number, size: string | null | undefined): number =>
  strength * CAPACITY_PER_STRENGTH_G * (SIZE_CAPACITY_FACTOR[size as CreatureSizeCode] ?? 1)

export interface Encumbrance {
  weightG: number
  capacityG: number
  level: EncumbranceLevel
}

export function encumbranceOf(weightG: number, strength: number, size: string | null | undefined): Encumbrance {
  const capacityG = carryingCapacityG(strength, size)
  const level: EncumbranceLevel = weightG > capacityG
    ? 'overloaded'
    : weightG > strength * HEAVILY_ENCUMBERED_PER_STRENGTH_G
      ? 'heavily'
      : weightG > strength * ENCUMBERED_PER_STRENGTH_G ? 'encumbered' : 'none'
  return { weightG, capacityG, level }
}

// Variante facultative : la vitesse baisse de 3 m (encombré) ou 6 m (fortement encombré) ; au-delà de la capacité, la règle ne prévoit rien de plus.
export const encumbranceSpeedPenalty = (level: EncumbranceLevel): number =>
  level === 'encumbered' ? ENCUMBERED_SPEED_PENALTY : level === 'none' ? 0 : HEAVILY_ENCUMBERED_SPEED_PENALTY

export const isHeavilyEncumbered = (level: EncumbranceLevel): boolean => level === 'heavily' || level === 'overloaded'

export const ENCUMBRANCE_LABELS: Record<Exclude<EncumbranceLevel, 'none'>, string> = {
  encumbered: 'Encombré',
  heavily: 'Fortement encombré',
  overloaded: 'Charge au-delà de la capacité',
}

export const formatWeightKg = (weightG: number): string =>
  `${(weightG / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} kg`
