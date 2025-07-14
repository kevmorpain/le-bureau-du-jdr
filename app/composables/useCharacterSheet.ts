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

  const characterLevel = useStorage<number>('characterLevel', 1)

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

  const spellSlots = useStorage<Record<number, { max: number, current: number }>>('spellSlots', {
    1: { max: 0, current: 0 },
    2: { max: 0, current: 0 },
    3: { max: 0, current: 0 },
    4: { max: 0, current: 0 },
    5: { max: 0, current: 0 },
    6: { max: 0, current: 0 },
    7: { max: 0, current: 0 },
    8: { max: 0, current: 0 },
    9: { max: 0, current: 0 },
  })

  const availableSpellSlots = computed(() => {
    return Object.entries(spellSlots.value).reduce<number[]>((acc, [level, slots]) => {
      if (slots.max > 0 && slots.current < slots.max) {
        acc.push(Number(level))
      }

      return acc
    }, [])
  })

  return {
    abilityScores,
    abilityModifiers,
    availableSpellSlots,
    characterLevel,
    proficiencyBonus,
    spellcastingAbility,
    spellcastingModifier,
    spellAttackModifier,
    spellSaveDC,
    spellSlots,
  }
}
