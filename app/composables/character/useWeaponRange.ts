import { useStorage } from '@vueuse/core'
import { NO_RANGE_CHOICE, type RangeChoice } from '~~/shared/rules/weaponRange'

// Distance de la cible, arme par arme : état de rencontre (comme les états et l'initiative), dans le navigateur, pas en base.
export const useWeaponRange = (characterId: number | undefined) => {
  const choices = useStorage<Record<string, RangeChoice>>(characterStorageKey(characterId, 'rangeChoices'), {})

  const choiceOf = (entryId: number): RangeChoice => choices.value[entryId] ?? NO_RANGE_CHOICE

  const setChoice = (entryId: number, patch: Partial<RangeChoice>) => {
    choices.value = { ...choices.value, [entryId]: { ...choiceOf(entryId), ...patch } }
  }

  return { choiceOf, setChoice }
}
