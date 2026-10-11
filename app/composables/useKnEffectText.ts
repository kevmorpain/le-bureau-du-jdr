import type { KnCreatureSelfEffect, KnSelfAmount } from '~~/shared/ker-nethalas/creatures'
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
      case 'damage': return `${amount(effect.dice, total)} dégâts${effect.direct ? ' directs à la Santé' : ''}${effect.half ? ' (moitié)' : ''}`
      case 'exhaustion': return `${sign(effect.sign)}${amount(effect.dice, total)} Épuisement`
      case 'condition': return `${t(`ker_nethalas.conditions.${effect.key}.name`)}${effect.value ? ` (${effect.value})` : ''}`
      case 'temporary': return `+${amount(effect.dice, total)} ${vital(effect.vital)} temporaire`
      case 'tensionReset': return 'Dé de Tension remis à D8'
      case 'darkness': return 'tirage dans l\'Obscurité Grandissante'
      case 'lairDown': return 'Dé de Lair : un cran plus bas'
    }
  }

  const effectsText = (effects: readonly KnTableEffect[]) => effects.map(effect => effectText(effect)).join(', ')

  const SELF_BASE = { damage: 'des dégâts infligés', maxHealth: 'de sa Santé maximale', health: 'de sa Santé actuelle' } as const

  function selfAmountText(amount: KnSelfAmount): string {
    if ('dice' in amount) return knDiceLabel(amount.dice)
    return `${amount.ratio === 0.5 ? 'la moitié' : `${Math.round(amount.ratio * 100)} %`} ${SELF_BASE[amount.of]}`
  }

  function selfEffectText(effect: KnCreatureSelfEffect): string {
    if (effect.kind === 'heal') return `récupère ${selfAmountText(effect.amount)} en Santé`
    const until = effect.until === 'turn' ? ', jusqu\'à son prochain tour' : effect.until === 'round' ? ', jusqu\'à la fin du round' : ''
    const cap = effect.cap ? `, sans dépasser ${effect.cap} fois sa Santé` : ''
    return `gagne ${selfAmountText(effect.amount)} en Santé temporaire${cap}${until}`
  }

  function outcomeText({ effect, roll, draw }: KnTableEffectOutcome): string {
    if (draw) return `Obscurité Grandissante ${draw.roll}`
    return effectText(effect, 'dice' in effect ? roll.total : undefined)
  }

  return { effectText, effectsText, outcomeText, selfEffectText }
}
