import type { AbilityScoreKey, Effect } from '~~/server/db/schema/effects'

// Un objet, un effet temporaire, ou le bloc des capacités : le libellé sert au détail affiché.
export interface EffectSource {
  label: string
  effects: Effect[]
}

export interface BonusPart {
  label: string
  amount: number
}

const bonusParts = (sources: readonly EffectSource[], amountOf: (e: Effect) => number): BonusPart[] =>
  sources.flatMap((source) => {
    const amount = source.effects.reduce((sum, e) => sum + amountOf(e), 0)
    return amount === 0 ? [] : [{ label: source.label, amount }]
  })

export const sumBonusParts = (parts: readonly BonusPart[]): number =>
  parts.reduce((sum, p) => sum + p.amount, 0)

export const armorClassBonusParts = (sources: readonly EffectSource[]): BonusPart[] =>
  bonusParts(sources, e => (e.type === 'armor_class_bonus' ? e.value.amount : 0))

export const WEAPON_BONUS_SCOPES = ['all', 'melee', 'ranged'] as const
export type WeaponBonusScope = typeof WEAPON_BONUS_SCOPES[number]

// Bonus aux jets d'attaque ou de dégâts d'arme qui ne tiennent pas à l'arme (son `magicBonus`) mais à une
// capacité, un objet porté ou un effet temporaire ; il vise toutes les armes, le corps à corps ou la distance.
export const weaponBonusParts = (
  sources: readonly EffectSource[],
  roll: 'attack' | 'damage',
  weapon: { isRanged: boolean },
): BonusPart[] => {
  const type = roll === 'attack' ? 'weapon_attack_bonus' : 'weapon_damage_bonus'
  return bonusParts(sources, (e) => {
    if (e.type !== 'weapon_attack_bonus' && e.type !== 'weapon_damage_bonus') return 0
    const reaches = e.value.weapons === 'all' || (e.value.weapons === 'ranged') === weapon.isRanged
    return e.type === type && reaches ? e.value.amount : 0
  })
}

export const savingThrowBonusParts = (sources: readonly EffectSource[], ability: AbilityScoreKey): BonusPart[] =>
  bonusParts(sources, e =>
    e.type === 'saving_throw_bonus' && (e.value.ability === 'all' || e.value.ability === ability) ? e.value.amount : 0)
