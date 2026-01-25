import { useStorage } from '@vueuse/core'

export const useCharacterSheet = (characterSheet: Ref<CharacterSheet>) => {
  const species = computed(() => characterSheet.value.species)
  const speed = computed<number>(() => species.value?.speed ?? 0)

  const characterClasses = computed(() => characterSheet.value.classes?.map((cls) => {
    const { class: classInfo, ...rest } = cls

    return {
      ...rest,
      ...classInfo,
    }
  }) || [])

  const characterLevel = computed<number>(() => characterClasses.value.reduce<number>((acc, cls) => acc + cls.level, 0))

  const mainClass = computed(() => characterClasses.value.find(cls => cls.isMain)!)
  const multiClass = computed(() => characterClasses.value.filter(cls => !cls.isMain))

  const hitDice = computed(() =>
    Object.entries(
      characterClasses.value.reduce<Record<string, number>>((acc, cls) => {
        acc[cls.hitDice!] = (acc[cls.hitDice!] ?? 0) + cls.level
        return acc
      }, {}),
    ).map(([hitDie, count]) => ({ hitDie: hitDie.slice(1), count })),
  )

  const characterAbilityScores = computed(() => characterSheet.value.baseAbilityScores?.reduce<Record<string, number>>((acc, abs) => {
    acc[abs.abilityId] = abs.value

    return acc
  }, {}) || {})

  const getAbilityScore = (abilityId: string): number => {
    return characterAbilityScores.value[abilityId] || 10
  }

  const abilityScoreOrder = ['str', 'dex', 'con', 'int', 'wis', 'cha']

  // TODO: should be total with all bonuses
  const abilityScores = computed<Record<string, number>>(() => abilityScoreOrder.reduce<Record<string, number>>((acc, abilityId) => {
    acc[abilityId] = getAbilityScore(abilityId)

    return acc
  }, {}))

  const abilityModifiers = computed<Record<string, number>>(() => Object.entries(abilityScores.value!).reduce<Record<string, number>>((acc, [key, score]) => {
    acc[key] = Math.floor((score - 10) / 2)

    return acc
  }, {}))

  const proficiencyBonus = computed<number>(() => {
    return Math.floor((characterLevel.value - 1) / 4) + 2
  })

  const armorClass = useStorage<number>('armorClass', 10)

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

  const formatModifier = (modifier: number | null): string => {
    if (modifier === null) return '-'
    return modifier >= 0 ? `+${modifier}` : `${modifier}`
  }

  return {
    abilityScores,
    abilityModifiers,
    availableSpellSlots,
    characterLevel,
    hitDice,
    mainClass,
    multiClass,
    proficiencyBonus,
    spellcastingAbility,
    spellcastingModifier,
    spellAttackModifier,
    spellSaveDC,
    spellSlots,
    species,
    armorClass,
    speed,
    formatModifier,
  }
}
