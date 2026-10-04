import { useStorage } from '@vueuse/core'
import type { DiceRoll } from '../useDiceRoller'

const HISTORY_LIMIT = 100

// Journal des jets d'un personnage : seul le navigateur le garde, comme l'état de rencontre.
export const useRollHistory = (characterId: number | undefined) => {
  const entries = useStorage<DiceRoll[]>(characterStorageKey(characterId, 'rollHistory'), [])

  const push = (roll: DiceRoll) => {
    entries.value = [roll, ...entries.value].slice(0, HISTORY_LIMIT)
  }
  const clear = () => {
    entries.value = []
  }

  return { entries, push, clear }
}
