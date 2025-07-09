import { useStorage } from '@vueuse/core'

export const useCharacterSheet = () => {
  const abilityScores = useStorage<Record<string, number>>('abilityScores', {
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
  })

  const abilityModifiers = computed<Record<string, number>>(() => Object.entries(abilityScores.value!).reduce<Record<string, number>>((acc, [key, score]) => {
    acc[key] = Math.floor((score - 10) / 2)
    return acc
  }, {}))

  return {
    abilityScores,
    abilityModifiers,
  }
}
