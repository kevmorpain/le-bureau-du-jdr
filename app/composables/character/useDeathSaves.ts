import type { RollFn } from '../useDiceRoller'
import { rollDeathSave, type DeathSaveOutcome } from '~~/shared/rules/damage'

export const useDeathSaves = (characterSheet: Ref<CharacterSheet>) => {
  const { t } = useI18n()
  const toaster = useToast()
  const { hitPointState, setHitPointState, isDead, isDying, isStable } = useCharacterSheet(characterSheet)

  const successes = computed({
    get: () => hitPointState.value.deathSaveSuccesses,
    set: (n: number) => setHitPointState({ ...hitPointState.value, deathSaveSuccesses: n }),
  })
  const failures = computed({
    get: () => hitPointState.value.deathSaveFailures,
    set: (n: number) => setHitPointState({ ...hitPointState.value, deathSaveFailures: n }),
  })

  const lastOutcome = ref<{ natural: number, outcome: DeathSaveOutcome } | null>(null)

  // A d20 entered at the table follows the same rule as a roll made in the app.
  const applyNatural = (natural: number): DeathSaveOutcome => {
    const { state, outcome } = rollDeathSave(hitPointState.value, natural)
    setHitPointState(state)
    lastOutcome.value = { natural, outcome }
    if (outcome === 'recovered') toaster.add({ title: t('hit_points.death_saves.recovered'), color: 'success' })
    else if (outcome === 'two-failures') toaster.add({ title: t('hit_points.death_saves.two_failures'), color: 'error' })
    return outcome
  }

  const rollSave = (roll: RollFn) => applyNatural(roll(t('hit_points.death_saves.roll_label'), 0))

  return { successes, failures, isDead, isDying, isStable, lastOutcome, applyNatural, rollSave }
}
