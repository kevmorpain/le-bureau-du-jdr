import { knDiceLabel, type KnDice } from '~~/shared/ker-nethalas/dice'
import type { KnTableEffect, KnTableEffectOutcome } from '~~/shared/ker-nethalas/tables'

export function useKnEffectText() {
  const { t } = useI18n()

  const sign = (kind: 'gain' | 'loss' | undefined) => kind === 'loss' ? '−' : '+'
  const vital = (key: string) => t(`ker_nethalas.vitals.${key}`).toLowerCase()

  function amount(dice: KnDice, total?: number) {
    return total === undefined ? knDiceLabel(dice) : String(total)
  }

  // `total` : le résultat déjà lancé ; absent, la formule (« 2D6 »).
  function effectText(effect: KnTableEffect, total?: number): string {
    switch (effect.kind) {
      case 'coins': return `${sign(effect.sign)}${amount(effect.dice, total)} ₵`
      case 'provision': return `${sign(effect.sign)}${amount(effect.dice, total)} ${t(`ker_nethalas.provisions.${effect.key}`)}`
      case 'xp': return `+${effect.amount} XP`
      case 'vital': return `${sign(effect.sign)}${amount(effect.dice, total)} ${vital(effect.vital)}`
      case 'damage': return `${amount(effect.dice, total)} dégâts`
      case 'exhaustion': return `${sign(effect.sign)}${amount(effect.dice, total)} Épuisement`
      case 'condition': return `${t(`ker_nethalas.conditions.${effect.key}.name`)}${effect.value ? ` (${effect.value})` : ''}`
      case 'temporary': return `+${amount(effect.dice, total)} ${vital(effect.vital)} temporaire`
      case 'tensionReset': return 'Dé de Tension remis à D8'
      case 'darkness': return 'tirage dans l\'Obscurité Grandissante'
      case 'lairDown': return 'Dé de Lair : un cran plus bas'
    }
  }

  const effectsText = (effects: readonly KnTableEffect[]) => effects.map(effect => effectText(effect)).join(', ')

  function outcomeText({ effect, roll, draw }: KnTableEffectOutcome): string {
    if (draw) return `Obscurité Grandissante ${draw.roll}`
    return effectText(effect, 'dice' in effect ? roll.total : undefined)
  }

  return { effectText, effectsText, outcomeText }
}
