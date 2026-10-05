import { isDead as deadByDeathSaves, isDying as dyingAt, isStable as stableAt, type HitPointState } from '~~/shared/rules/damage'

// Épuisement : niveau 6 = mort.
const LETHAL_EXHAUSTION = 6

// PV, PV temporaires et jets contre la mort de la fiche, vus comme l'état que manipulent les règles de shared/rules/damage.
export const useCharacterVitals = (characterSheet?: Ref<CharacterSheet>) => {
  const hitPointState = computed<HitPointState>(() => ({
    currentHp: characterSheet?.value?.currentHp ?? 0,
    temporaryHp: characterSheet?.value?.temporaryHp ?? 0,
    deathSaveSuccesses: characterSheet?.value?.deathSaveSuccesses ?? 0,
    deathSaveFailures: characterSheet?.value?.deathSaveFailures ?? 0,
  }))

  // Mutation en place de la fiche, comme `sheetTextField` : les sections qui la reçoivent en prop restent persistées par le deep watch.
  const setHitPointState = (next: HitPointState) => {
    const sheet = characterSheet?.value
    if (!sheet) return
    sheet.currentHp = next.currentHp
    sheet.temporaryHp = next.temporaryHp
    sheet.deathSaveSuccesses = next.deathSaveSuccesses
    sheet.deathSaveFailures = next.deathSaveFailures
  }

  const isDead = computed(() =>
    deadByDeathSaves(hitPointState.value) || (characterSheet?.value?.exhaustionLevel ?? 0) >= LETHAL_EXHAUSTION,
  )
  const isDying = computed(() => dyingAt(hitPointState.value))
  const isStable = computed(() => stableAt(hitPointState.value))

  return { hitPointState, setHitPointState, isDead, isDying, isStable }
}
