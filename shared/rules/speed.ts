import type { Effect } from '~~/server/db/schema/effects'
import { evaluate } from '~~/shared/utils/formula'
import type { FormulaContext } from '~~/shared/utils/formula'
import type { BonusPart, EffectSource } from './effectBonuses'

export type SpeedBonusCondition = 'no_heavy_armor' | 'no_armor_no_shield'

export interface WornArmor {
  heavy: boolean
  body: boolean
  shield: boolean
}

// Armures : une armure dont la colonne Force n'est pas atteinte réduit la vitesse de 3 mètres.
export const ARMOR_STRENGTH_SPEED_PENALTY = 3

export const speedBonusApplies = (condition: SpeedBonusCondition | undefined, worn: WornArmor): boolean => {
  if (condition === 'no_heavy_armor') return !worn.heavy
  if (condition === 'no_armor_no_shield') return !worn.body && !worn.shield
  return true
}

// Les formules d'une capacité de classe s'évaluent au niveau de SA classe : chaque source porte son contexte.
export interface SpeedBonusSource extends EffectSource {
  context: FormulaContext
}

export const speedBonusParts = (sources: readonly SpeedBonusSource[], worn: WornArmor): BonusPart[] =>
  sources.flatMap(({ label, effects, context }) => {
    const amount = effects.reduce(
      (sum, e) => (e.type === 'speed_bonus' && speedBonusApplies(e.value.while, worn) ? sum + evaluate(e.value.amount, context) : sum),
      0,
    )
    return amount === 0 ? [] : [{ label, amount }]
  })

export interface WornBodyArmor {
  name: string
  armorType: string
  strengthRequirement?: number
}

export interface ArmorSpeedPenalty {
  amount: number
  source: string
  reason: string
}

// Le Nain : « votre vitesse n'est pas réduite par le port d'une armure lourde ».
const negatesArmorSpeedPenalty = (effects: readonly Effect[], armorType: string): boolean =>
  effects.some(e =>
    e.type === 'equipment_penalty'
    && e.value.penalty === 'speed'
    && e.value.armor_type === armorType
    && e.value.override)

export const armorSpeedPenalty = (
  armor: WornBodyArmor | null,
  strengthScore: number,
  effects: readonly Effect[],
): ArmorSpeedPenalty | null => {
  const required = armor?.strengthRequirement
  if (!armor || required == null || strengthScore >= required) return null
  if (negatesArmorSpeedPenalty(effects, armor.armorType)) return null
  return {
    amount: ARMOR_STRENGTH_SPEED_PENALTY,
    source: armor.name,
    reason: `${armor.name} : Force ${required} requise (vitesse -${ARMOR_STRENGTH_SPEED_PENALTY} m)`,
  }
}

export const computeWalkingSpeed = (base: number, bonuses: readonly BonusPart[], penalty: ArmorSpeedPenalty | null): number =>
  Math.max(0, base + bonuses.reduce((sum, b) => sum + b.amount, 0) - (penalty?.amount ?? 0))
