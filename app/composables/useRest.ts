import { hitDiceTotals, recoverHitDice } from '~~/shared/rules/hitDice'
import { resourceFeaturesOf, restRecovery } from '~~/shared/rules/classResources'
import type { RestType } from '~~/shared/utils/rest'

type SlotState = { max: number, current: number, created?: number }
type SlotsByType = {
  spellcasting: Record<number, SlotState>
  pact_magic: Record<number, SlotState>
}

// Les emplacements créés par les points de sorcellerie disparaissent au repos long.
const refillSlots = (slots: Record<number, SlotState>, { dropCreated = false } = {}) => {
  for (const lvl in slots) {
    const s = slots[lvl]!
    if (dropCreated && s.created) {
      s.max -= s.created
      s.created = 0
    }
    s.current = s.max > 0 ? s.max : 0
  }
}

type RestResponse = { rechargedItems?: { name: string, rolled: number }[] }

// Les charges rendues par un dé (« 1d6+4 à l'aube ») sont tirées par le serveur : on les annonce d'après sa réponse.
const rechargeSummary = (res: unknown): string | undefined => {
  const items = (res as RestResponse | null)?.rechargedItems ?? []
  return items.length ? items.map(i => `${i.name} : +${i.rolled} charge${i.rolled > 1 ? 's' : ''}`).join(' · ') : undefined
}

export const useRest = (
  characterSheet: Ref<CharacterSheet>,
  spellSlots: Ref<SlotsByType> | undefined,
  // Maximum de PV selon le niveau d'épuisement : la même règle que le serveur (shared/rules/hitPoints.ts).
  maxHpAt: (exhaustionLevel: number) => number,
) => {
  const toaster = useToast()
  const isResting = ref(false)
  const { offlineMutate } = useOfflineMutation(() => characterSheet.value.id)

  // Même règle que le serveur (`characterRest`) : remises à zéro, regains partiels, fin de ce qui dure une minute.
  const recoverFeatures = (rest: RestType) => {
    const features = characterSheet.value.features ?? []
    const recovery = restRecovery(resourceFeaturesOf(features), characterSheet.value.classes ?? [], rest)
    for (const cf of features) {
      if (recovery.reset.includes(cf.featureId)) cf.currentUses = 0
      const regain = recovery.regain.find(r => r.featureId === cf.featureId)
      if (regain) cf.currentUses = Math.max(0, cf.currentUses - regain.amount)
      if (rest !== 'dawn') cf.active = false
    }
  }

  const resetDeathSaves = () => {
    characterSheet.value.deathSaveSuccesses = 0
    characterSheet.value.deathSaveFailures = 0
  }

  const shortRest = async (hitDiceSpent: { die: string, count: number, healAmount: number }[] = []) => {
    isResting.value = true
    let summary: string | undefined
    try {
      await offlineMutate({
        onServerResponse: (res) => { summary = rechargeSummary(res) },
        endpoint: `/api/character_sheets/${characterSheet.value.id}/rest`,
        method: 'POST',
        body: { type: 'short', hitDiceSpent },
        label: 'Repos court',
      })

      recoverFeatures('short')

      if (spellSlots?.value) refillSlots(spellSlots.value.pact_magic)
      characterSheet.value.spellSlots
        ?.filter(s => s.slotType === 'pact_magic')
        .forEach((s) => { s.used = 0 })

      if (hitDiceSpent.length > 0) {
        const totalHeal = hitDiceSpent.reduce((sum, d) => sum + d.healAmount, 0)
        characterSheet.value.currentHp = Math.min(
          characterSheet.value.currentHp + totalHeal,
          maxHpAt(characterSheet.value.exhaustionLevel),
        )
        if (totalHeal > 0) resetDeathSaves()
      }

      toaster.add({ title: 'Repos court terminé', description: summary, color: 'success' })
    }
    catch {
      toaster.add({ title: 'Erreur lors du repos', color: 'error' })
    }
    finally {
      isResting.value = false
    }
  }

  const longRest = async (fedAndWatered = true) => {
    isResting.value = true
    let summary: string | undefined
    try {
      await offlineMutate({
        onServerResponse: (res) => { summary = rechargeSummary(res) },
        endpoint: `/api/character_sheets/${characterSheet.value.id}/rest`,
        method: 'POST',
        body: { type: 'long', fedAndWatered },
        label: 'Repos long',
      })

      recoverFeatures('long')

      // Le maximum se lit après la baisse d'épuisement : au niveau 4 il est divisé par deux.
      if (fedAndWatered) characterSheet.value.exhaustionLevel = Math.max(0, characterSheet.value.exhaustionLevel - 1)
      characterSheet.value.currentHp = maxHpAt(characterSheet.value.exhaustionLevel)
      characterSheet.value.temporaryHp = 0
      resetDeathSaves()

      if (spellSlots?.value) {
        refillSlots(spellSlots.value.spellcasting, { dropCreated: true })
        refillSlots(spellSlots.value.pact_magic)
      }
      characterSheet.value.spellSlots?.forEach((slot) => {
        slot.used = 0
        slot.created = 0
      })

      characterSheet.value.currentHitDie = recoverHitDice(
        characterSheet.value.currentHitDie,
        hitDiceTotals((characterSheet.value.classes ?? []).map(cls => ({ level: cls.level, hitDice: cls.class?.hitDice }))),
      )

      toaster.add({ title: 'Repos long terminé — PV restaurés', description: summary, color: 'success' })
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
    let summary: string | undefined
    try {
      await offlineMutate({
        onServerResponse: (res) => { summary = rechargeSummary(res) },
        endpoint: `/api/character_sheets/${characterSheet.value.id}/rest`,
        method: 'POST',
        body: { type: 'dawn' },
        label: 'Aube',
      })

      recoverFeatures('dawn')

      toaster.add({ title: 'Nouvelle aube — aptitudes rechargées', description: summary, color: 'success' })
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
