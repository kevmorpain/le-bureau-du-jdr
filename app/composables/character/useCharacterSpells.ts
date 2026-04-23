export type CharacterSpellWithSpell = CharacterSpell & { spell: Spell }

export const useCharacterSpells = (
  characterSheet?: Ref<CharacterSheet>,
  deps?: {
    spellSlots: Ref<Record<number, { max: number, current: number }>>
  },
) => {
  const characterId = computed(() => characterSheet?.value?.id)

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const { data: characterSpells, refresh: refreshSpells } = useFetch(
    () => characterId.value !== undefined
      ? `/api/character_sheets/${characterId.value}/spells`
      : null,
    { watch: [characterId] },
  )

  // ─── Filters ──────────────────────────────────────────────────────────────

  const showPreparedOnly = ref(false)
  const showAvailableOnly = ref(false)

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const isSpellAvailable = (spell: Spell): boolean => {
    if (spell.level === 0) return true
    return (deps?.spellSlots.value[spell.level]?.current ?? 0) > 0
  }

  // ─── Computed: grouped by level ───────────────────────────────────────────

  const spellsByLevel = computed(() => {
    const spells = characterSpells.value ?? []
    const filtered = spells.filter((cs) => {
      if (showPreparedOnly.value && !cs.isPrepared) return false
      if (showAvailableOnly.value && !isSpellAvailable(cs.spell)) return false
      return true
    })

    const grouped: Record<number, CharacterSpellWithSpell[]> = {}
    for (const cs of filtered) {
      const level = cs.spell.level
      if (!grouped[level]) grouped[level] = []
      grouped[level].push(cs)
    }

    return Object.entries(grouped)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([level, spells]) => ({ level: Number(level), spells }))
  })

  // ─── Actions ──────────────────────────────────────────────────────────────

  const togglePrepared = async (spellId: number, isPrepared: boolean) => {
    if (!characterSpells.value) return

    characterSpells.value = characterSpells.value.map(cs =>
      cs.spellId === spellId ? { ...cs, isPrepared } : cs,
    )

    try {
      await $fetch(`/api/character_sheets/${characterId.value}/spells`, {
        method: 'PUT',
        body: [{ spellId, isKnown: true, isPrepared }],
      })
    }
    catch {
      characterSpells.value = characterSpells.value.map(cs =>
        cs.spellId === spellId ? { ...cs, isPrepared: !isPrepared } : cs,
      )
    }
  }

  const addSpell = async (spellId: number) => {
    await $fetch(`/api/character_sheets/${characterId.value}/spells`, {
      method: 'PUT',
      body: [{ spellId, isKnown: true, isPrepared: false }],
    })
    await refreshSpells()
  }

  const removeSpell = async (spellId: number) => {
    await $fetch(`/api/character_sheets/${characterId.value}/spells`, {
      method: 'DELETE',
      body: { spellId },
    })
    if (characterSpells.value) {
      const idx = characterSpells.value.findIndex(cs => cs.spellId === spellId)
      if (idx !== -1) characterSpells.value.splice(idx, 1)
    }
  }

  const castSpell = (slotLevel: number) => {
    const slot = deps?.spellSlots.value[slotLevel]
    if (slot && slot.current > 0) {
      slot.current--
    }
  }

  return {
    characterSpells,
    spellsByLevel,
    showPreparedOnly,
    showAvailableOnly,
    isSpellAvailable,
    togglePrepared,
    addSpell,
    removeSpell,
    castSpell,
    refreshSpells,
  }
}
