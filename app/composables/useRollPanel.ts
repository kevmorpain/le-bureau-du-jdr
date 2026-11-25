import type { DiceRoll } from './useDiceRoller'
import { situationLabel, type RollOverride } from '~~/shared/rules/rolls'

export const ROLL_OVERRIDES: readonly RollOverride[] = ['auto', 'advantage', 'disadvantage', 'normal']

// What the next roll will use (mode, situations, critical damage) and the history, as the roll panel shows them.
export const useRollPanel = () => {
  const { t } = useI18n()
  const { toasts, roll, engine, history, rollsEnabled } = useDiceRoller()
  const pending = engine.pending
  const situations = engine.situations

  const modeLabel = (mode: RollOverride) => t(`rolls.modes.${mode}`)

  const toggleSituation = (situation: string) => {
    const selected = pending.value.situations
    pending.value.situations = selected.includes(situation) ? selected.filter(s => s !== situation) : [...selected, situation]
  }

  const hasPending = computed(() => pending.value.override !== 'auto' || pending.value.situations.length > 0 || pending.value.crit)

  // The next roll stays visible on the button, panel closed.
  const pendingLabel = computed(() => {
    if (!hasPending.value) return null
    return [
      ...(pending.value.override === 'auto' ? [] : [modeLabel(pending.value.override)]),
      ...pending.value.situations.map(situationLabel),
      ...(pending.value.crit ? [t('rolls.crit_short')] : []),
    ].join(' · ')
  })

  const timeOf = (entry: DiceRoll) =>
    new Date(entry.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  const replay = (entry: DiceRoll) => {
    const { label, modifier, sides, count, options } = entry.replay
    roll(label, modifier, sides, count, options)
  }

  const copy = async (entry: DiceRoll) => {
    try {
      await navigator.clipboard.writeText(rollText(entry))
      useToast().add({ title: t('rolls.copied'), color: 'success' })
    } catch {
      useToast().add({ title: t('rolls.copy_failed'), color: 'error' })
    }
  }

  return { toasts, roll, history, rollsEnabled, pending, situations, modeLabel, toggleSituation, hasPending, pendingLabel, timeOf, replay, copy }
}
