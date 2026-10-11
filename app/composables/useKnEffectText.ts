import type { KnCreatureBuff } from '~~/shared/ker-nethalas/combatState'
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
      case 'timed': {
        const rounds = total ? ` (${total} round${total > 1 ? 's' : ''})` : effect.rounds ? ` (${knDiceLabel(effect.rounds)} rounds)` : ''
        const tick = effect.tick ? `, ${knDiceLabel(effect.tick.dice)} dégâts${effect.tick.direct ? ' directs' : ''} à chaque début de tour` : ''
        return `${effect.label}${rounds}${tick}`
      }
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

  const types = (list: readonly string[]) => list.map(key => t(`ker_nethalas.damageTypes.${key}`).toLowerCase()).join(', ')
  const signed = (value: number) => value > 0 ? `+${value}` : String(value)

  // Ce qu'un effet change chez la créature, en une phrase.
  function buffParts(effect: Omit<KnCreatureBuff, 'label' | 'rounds' | 'untilTurn'>): string[] {
    return [
      ...(effect.resistantAll ? [`résistante à tous les dégâts${effect.resistantExcept?.length ? ` sauf ${types(effect.resistantExcept)}` : ''}`] : []),
      ...(effect.resistant?.length ? [`résistante aux dégâts ${types(effect.resistant)}`] : []),
      ...(effect.immune?.length ? [`immunisée aux dégâts ${types(effect.immune)}`] : []),
      ...(effect.immuneNonMagical ? ['immunisée aux dégâts non magiques'] : []),
      ...(effect.vulnerableAll ? ['vulnérable à tous les dégâts'] : []),
      ...(effect.disadvantageAgainst ? ['les attaques qui la visent ont le Désavantage'] : []),
      ...(effect.advantage ? [effect.advantage === 'attack' ? 'Avantage à ses attaques' : 'Avantage à ses défenses'] : []),
      ...(effect.combatSkill ? [`Compétence de combat ${signed(effect.combatSkill)}`] : []),
      ...(effect.defenseSkill ? [`défense ${signed(effect.defenseSkill)}`] : []),
      ...(effect.damageBonus ? [`${knDiceLabel(effect.damageBonus)} dégâts de plus`] : []),
      ...(effect.reflect ? [`${knDiceLabel(effect.reflect.dice)} dégâts ${types([effect.reflect.type])} à qui l'attaque`] : []),
    ]
  }

  function selfEffectText(effect: KnCreatureSelfEffect, nameOf: (ref: string) => string = ref => ref): string {
    if (effect.kind === 'summon') return `invoque ${knDiceLabel(effect.count)} ${nameOf(effect.ref)}${effect.max ? ` (${effect.max} au plus en même temps)` : ''}`
    if (effect.kind === 'buff') {
      const duration = effect.untilTurn ? ' jusqu\'à son prochain tour' : effect.rounds ? ` pendant ${knDiceLabel(effect.rounds)} round(s)` : ' jusqu\'à la fin du combat'
      const scope = effect.scope === 'sameSheet' ? ' (toutes les créatures de sa fiche)' : ''
      return `est sous l'effet de « ${effect.label} »${duration}${scope} : ${buffParts(effect).join(', ')}`
    }
    if (effect.kind === 'heal') return `récupère ${selfAmountText(effect.amount)} en Santé`
    const until = effect.until === 'turn' ? ', jusqu\'à son prochain tour' : effect.until === 'round' ? ', jusqu\'à la fin du round' : ''
    const cap = effect.cap ? `, sans dépasser ${effect.cap} fois sa Santé` : ''
    return `gagne ${selfAmountText(effect.amount)} en Santé temporaire${cap}${until}`
  }

  function outcomeText({ effect, roll, draw }: KnTableEffectOutcome): string {
    if (draw) return `Obscurité Grandissante ${draw.roll}`
    return effectText(effect, 'dice' in effect || effect.kind === 'timed' ? roll.total : undefined)
  }

  return { effectText, effectsText, outcomeText, selfEffectText, buffParts }
}
