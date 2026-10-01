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

export const savingThrowBonusParts = (sources: readonly EffectSource[], ability: AbilityScoreKey): BonusPart[] =>
  bonusParts(sources, e =>
    e.type === 'saving_throw_bonus' && (e.value.ability === 'all' || e.value.ability === ability) ? e.value.amount : 0)
