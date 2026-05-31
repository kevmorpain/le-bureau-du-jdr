export type Background = {
  id: number
  name: string
  description: string
  skillProficiencies: string[]
  toolProficiencies: string[]
  languageProficiencies: string[]
  featureName: string
  featureDescription: string
  characterSheetId: number | null
}

export const useCharacterBackground = (characterSheet?: Ref<CharacterSheet>) => {
  const characterId = computed(() => characterSheet?.value?.id)
  const { offlineMutate } = useOfflineMutation(() => characterId.value ?? 0)

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const { data: backgrounds, refresh: refreshBackgrounds } = useFetch<Background[]>(
    () => characterId.value !== undefined
      ? `/api/backgrounds?characterSheetId=${characterId.value}`
      : null,
    { watch: [characterId], default: () => [] },
  )

  // ─── Background sélectionné ───────────────────────────────────────────────

  const selectedBackground = computed<Background | null>(() =>
    backgrounds.value.find(b => b.id === characterSheet?.value?.backgroundId) ?? null,
  )

  // ─── Changer de background (sync compétences côté serveur) ───────────────

  async function setBackground(backgroundId: number | null) {
    if (!characterId.value) return
    // Optimiste d'abord (l'auto-save de la fiche reflétera aussi backgroundId).
    if (characterSheet?.value) {
      characterSheet.value = { ...characterSheet.value, backgroundId }
    }
    // Le serveur resync aussi les compétences du background ; la réconciliation post-sync les récupère.
    await offlineMutate({
      endpoint: `/api/character_sheets/${characterId.value}/background`,
      method: 'PUT',
      body: { backgroundId },
      dedupeKey: 'background',
      label: 'Historique',
    })
  }

  async function createCustomBackground(data: Omit<Background, 'id' | 'characterSheetId'>) {
    if (!characterId.value) return
    const created = await $fetch<Background>('/api/backgrounds', {
      method: 'POST',
      body: { ...data, characterSheetId: characterId.value },
    })
    await refreshBackgrounds()
    return created
  }

  // ─── Champs de personnalité (auto-save via deep watch dans [id].vue) ──────

  const personalityTraits = computed({
    get: () => characterSheet?.value?.personalityTraits ?? '',
    set: (v: string) => {
      if (characterSheet?.value) characterSheet.value = { ...characterSheet.value, personalityTraits: v }
    },
  })

  const ideals = computed({
    get: () => characterSheet?.value?.ideals ?? '',
    set: (v: string) => {
      if (characterSheet?.value) characterSheet.value = { ...characterSheet.value, ideals: v }
    },
  })

  const bonds = computed({
    get: () => characterSheet?.value?.bonds ?? '',
    set: (v: string) => {
      if (characterSheet?.value) characterSheet.value = { ...characterSheet.value, bonds: v }
    },
  })

  const flaws = computed({
    get: () => characterSheet?.value?.flaws ?? '',
    set: (v: string) => {
      if (characterSheet?.value) characterSheet.value = { ...characterSheet.value, flaws: v }
    },
  })

  return {
    backgrounds,
    selectedBackground,
    setBackground,
    createCustomBackground,
    refreshBackgrounds,
    personalityTraits,
    ideals,
    bonds,
    flaws,
  }
}
