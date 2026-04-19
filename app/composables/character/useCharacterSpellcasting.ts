import { useStorage } from '@vueuse/core'

export const useCharacterSpellcasting = (
  characterSheet?: Ref<CharacterSheet>,
  deps?: {
    proficiencyBonus: ComputedRef<number>
    abilityModifiers: ComputedRef<Record<string, number>>
  },
) => {
  const storageKey = (suffix: string) => {
    const id = characterSheet?.value?.id
    return id ? `char:${id}:${suffix}` : suffix
  }

  const spellcastingAbility = useStorage<string | null>(storageKey('spellcastingAbility'), null)

  const spellcastingModifier = computed<number | null>(() => {
    if (!spellcastingAbility.value) return null
    return (deps?.abilityModifiers.value[spellcastingAbility.value]) ?? null
  })

  const spellSaveDC = computed<number | null>(() => {
    if (!spellcastingAbility.value) return null
    const prof = deps?.proficiencyBonus.value ?? 2
    const mod = deps?.abilityModifiers.value[spellcastingAbility.value] ?? 0
    return 8 + prof + mod
  })

  const spellAttackModifier = computed<number | null>(() => {
    if (!spellcastingAbility.value) return null
    const prof = deps?.proficiencyBonus.value ?? 2
    const mod = deps?.abilityModifiers.value[spellcastingAbility.value] ?? 0
    return prof + mod
  })

  const spellSlots = useStorage<Record<number, { max: number, current: number }>>(storageKey('spellSlots'), {
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

  const availableSpellSlots = computed(() =>
    Object.entries(spellSlots.value).reduce<number[]>((acc, [level, slots]) => {
      if (slots.max > 0 && slots.current < slots.max) acc.push(Number(level))
      return acc
    }, []),
  )

  return {
    spellcastingAbility,
    spellcastingModifier,
    spellSaveDC,
    spellAttackModifier,
    spellSlots,
    availableSpellSlots,
  }
}
