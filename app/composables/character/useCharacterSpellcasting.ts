import { useStorage } from '@vueuse/core'

export const useCharacterSpellcasting = (
  characterSheet?: Ref<CharacterSheet>,
  deps?: {
    proficiencyBonus: ComputedRef<number>
    abilityModifiers: ComputedRef<Record<string, number>>
  },
) => {
  const storageKey = (suffix: string) => characterStorageKey(characterSheet?.value?.id, suffix)

  const spellcastingAbility = useStorage<string | null>(storageKey('spellcastingAbility'), null)

  // Shared base for DC and attack modifier computations
  const spellBaseStats = computed(() => {
    if (!spellcastingAbility.value) return null
    return {
      prof: deps?.proficiencyBonus.value ?? 2,
      mod: deps?.abilityModifiers.value[spellcastingAbility.value] ?? 0,
    }
  })

  const spellcastingModifier = computed<number | null>(() => {
    if (!spellcastingAbility.value) return null
    return deps?.abilityModifiers.value[spellcastingAbility.value] ?? null
  })

  const spellSaveDC = computed<number | null>(() =>
    spellBaseStats.value ? 8 + spellBaseStats.value.prof + spellBaseStats.value.mod : null,
  )

  const spellAttackModifier = computed<number | null>(() =>
    spellBaseStats.value ? spellBaseStats.value.prof + spellBaseStats.value.mod : null,
  )

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
