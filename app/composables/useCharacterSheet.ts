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

  const proficiencyBonus = useStorage<number>('proficiencyBonus', 2)

  const spellcastingAbility = useStorage<string | null>('spellcastingAbility', null)

  const spellcastingModifier = computed<number | null>(() => {
    if (!spellcastingAbility.value) return null
    return abilityModifiers.value[spellcastingAbility.value]!
  })

  const spellSaveDC = computed<number | null>(() => {
    if (!spellcastingAbility.value) return null

    return 8 + proficiencyBonus.value + abilityModifiers.value[spellcastingAbility.value]!
  })

  const spellAttackModifier = computed<number | null>(() => {
    if (!spellcastingAbility.value) return null

    return proficiencyBonus.value + abilityModifiers.value[spellcastingAbility.value]!
  })

  return {
    abilityScores,
    abilityModifiers,
    proficiencyBonus,
    spellcastingAbility,
    spellcastingModifier,
    spellSaveDC,
    spellAttackModifier,
  }
}
