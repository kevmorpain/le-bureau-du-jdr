export const useRest = (characterSheet: Ref<CharacterSheet>) => {
  const toaster = useToast()
  const isResting = ref(false)

  const shortRest = async (hitDiceSpent: { die: string, count: number, healAmount: number }[] = []) => {
    isResting.value = true
    try {
      await $fetch(`/api/character_sheets/${characterSheet.value.id}/rest`, {
        method: 'POST',
        body: { type: 'short', hitDiceSpent },
      })

      // Recharge short_rest features optimistically
      characterSheet.value.features?.forEach((cf) => {
        if (cf.feature?.rechargeType === 'short_rest') {
          cf.currentUses = 0
        }
      })

      // Apply healing
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
      await $fetch(`/api/character_sheets/${characterSheet.value.id}/rest`, {
        method: 'POST',
        body: { type: 'long' },
      })

      // Recharge all features with a recharge type
      characterSheet.value.features?.forEach((cf) => {
        if (cf.feature?.rechargeType) {
          cf.currentUses = 0
        }
      })

      // Restore HP
      characterSheet.value.currentHp = characterSheet.value.maxHp

      toaster.add({ title: 'Repos long terminé — PV restaurés', color: 'success' })
    }
    catch {
      toaster.add({ title: 'Erreur lors du repos', color: 'error' })
    }
    finally {
      isResting.value = false
    }
  }

  return { shortRest, longRest, isResting }
}
