type SlotState = { max: number, current: number }
type SlotsByType = {
  spellcasting: Record<number, SlotState>
  pact_magic: Record<number, SlotState>
}

const refillSlots = (slots: Record<number, SlotState>) => {
  for (const lvl in slots) {
    const s = slots[lvl]!
    if (s.max > 0) s.current = s.max
  }
}

export const useRest = (
  characterSheet: Ref<CharacterSheet>,
  spellSlots?: Ref<SlotsByType>,
) => {
  const toaster = useToast()
  const isResting = ref(false)
  const { offlineMutate } = useOfflineMutation(() => characterSheet.value.id)

  const shortRest = async (hitDiceSpent: { die: string, count: number, healAmount: number }[] = []) => {
    isResting.value = true
    try {
      await offlineMutate({
        endpoint: `/api/character_sheets/${characterSheet.value.id}/rest`,
        method: 'POST',
        body: { type: 'short', hitDiceSpent },
        label: 'Repos court',
      })

      characterSheet.value.features?.forEach((cf) => {
        if (cf.feature?.rechargeType === 'short_rest') {
          cf.currentUses = 0
        }
      })

      // Reset pact_magic spell slots (local + persisté côté DB par le serveur)
      if (spellSlots?.value) refillSlots(spellSlots.value.pact_magic)
      characterSheet.value.spellSlots
        ?.filter(s => s.slotType === 'pact_magic')
        .forEach((s) => { s.used = 0 })

      if (hitDiceSpent.length > 0) {
        const totalHeal = hitDiceSpent.reduce((sum, d) => sum + d.healAmount, 0)
        characterSheet.value.currentHp = Math.min(
          characterSheet.value.currentHp + totalHeal,
          characterSheet.value.maxHp,
        )
      }

      toaster.add({ title: 'Repos court terminé', color: 'success' })
    }
    catch {
      toaster.add({ title: 'Erreur lors du repos', color: 'error' })
    }
    finally {
      isResting.value = false
    }
  }

  const longRest = async () => {
    isResting.value = true
    try {
      await offlineMutate({
        endpoint: `/api/character_sheets/${characterSheet.value.id}/rest`,
        method: 'POST',
        body: { type: 'long' },
        label: 'Repos long',
      })

      characterSheet.value.features?.forEach((cf) => {
        if (cf.feature?.rechargeType === 'short_rest' || cf.feature?.rechargeType === 'long_rest') {
          cf.currentUses = 0
        }
      })

      characterSheet.value.currentHp = characterSheet.value.maxHp

      // Reset spell slots (local + DB)
      if (spellSlots?.value) {
        refillSlots(spellSlots.value.spellcasting)
        refillSlots(spellSlots.value.pact_magic)
      }
      characterSheet.value.spellSlots?.forEach((slot) => { slot.used = 0 })

      // Récupère la moitié des dés de vie (arrondi au supérieur) — règle D&D 5e 2014
      const hitDiceMax: Record<string, number> = {}
      for (const cls of characterSheet.value.classes ?? []) {
        const die = (cls.class as { hitDice?: string } | undefined)?.hitDice?.slice(1)
        if (die) hitDiceMax[die] = (hitDiceMax[die] ?? 0) + cls.level
      }

      const current = characterSheet.value.currentHitDie
        ?? Object.entries(hitDiceMax).map(([die, count]) => ({ die, count }))

      characterSheet.value.currentHitDie = current.map(entry => ({
        die: entry.die,
        count: Math.min(
          hitDiceMax[entry.die] ?? entry.count,
          entry.count + Math.ceil((hitDiceMax[entry.die] ?? 0) / 2),
        ),
      }))

      toaster.add({ title: 'Repos long terminé — PV restaurés', color: 'success' })
    }
    catch {
      toaster.add({ title: 'Erreur lors du repos', color: 'error' })
    }
    finally {
      isResting.value = false
    }
  }

  const dawn = async () => {
    isResting.value = true
    try {
      await offlineMutate({
        endpoint: `/api/character_sheets/${characterSheet.value.id}/rest`,
        method: 'POST',
        body: { type: 'dawn' },
        label: 'Aube',
      })

      characterSheet.value.features?.forEach((cf) => {
        if (cf.feature?.rechargeType === 'dawn') {
          cf.currentUses = 0
        }
      })

      toaster.add({ title: 'Nouvelle aube — aptitudes rechargées', color: 'success' })
    }
    catch {
      toaster.add({ title: 'Erreur lors de l\'aube', color: 'error' })
    }
    finally {
      isResting.value = false
    }
  }

  return { shortRest, longRest, dawn, isResting }
}
