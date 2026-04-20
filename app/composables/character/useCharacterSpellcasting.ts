export const useCharacterSpellcasting = (
  characterSheet?: Ref<CharacterSheet>,
  deps?: {
    proficiencyBonus: ComputedRef<number>
    abilityModifiers: ComputedRef<Record<string, number>>
  },
) => {
  // Surcharge character_classes ?? défaut classes. Le setter écrit l'override sur la classe principale.
  const spellcastingAbility = computed<string | null>({
    get: () => {
      const classes = characterSheet?.value?.classes ?? []
      const mainClass = classes.find(c => c.isMain) ?? classes[0]
      if (!mainClass) return null
      return mainClass.spellcastingAbility
        ?? (mainClass.class as { spellcastingAbility?: string | null } | undefined)?.spellcastingAbility
        ?? null
    },
    set: (v: string | null) => {
      if (!characterSheet?.value) return
      const classes = characterSheet.value.classes ?? []
      const mainClass = classes.find(c => c.isMain) ?? classes[0]
      if (mainClass) mainClass.spellcastingAbility = v
    },
  })

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

  // ─── Spell slots ──────────────────────────────────────────────────────────

  const spellSlots = ref<Record<number, { max: number, current: number }>>({
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

  // Initialisation depuis DB
  watchEffect(() => {
    const dbSlots = characterSheet?.value?.spellSlots ?? []
    for (const slot of dbSlots) {
      spellSlots.value[slot.slotLevel] = {
        max: slot.total,
        current: slot.total - slot.used,
      }
    }
  })

  // Synchronisation vers DB (debounce 500ms)
  let syncTimeout: ReturnType<typeof setTimeout> | null = null
  watch(spellSlots, () => {
    if (!characterSheet?.value?.id) return
    if (syncTimeout) clearTimeout(syncTimeout)
    syncTimeout = setTimeout(async () => {
      await $fetch(`/api/character_sheets/${characterSheet!.value!.id}/spell-slots`, {
        method: 'PUT',
        body: Object.entries(spellSlots.value)
          .filter(([, s]) => s.max > 0)
          .map(([level, s]) => ({
            slotLevel: Number(level),
            slotType: 'spellcasting',
            total: s.max,
            used: s.max - s.current,
          })),
      })
    }, 500)
  }, { deep: true })

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
