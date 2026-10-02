import type { ResourceGroup } from '~~/shared/rules/classResources'
import { SORCERY_MAX_CREATED_SLOT_LEVEL, pointsAfterSlotConversion, slotCreationCost } from '~~/shared/rules/sorcery'

type SlotState = { max: number, current: number, created?: number }
type SlotsByType = { spellcasting: Record<number, SlotState>, pact_magic: Record<number, SlotState> }

// Dépense et regain écrivent la valeur ABSOLUE de `currentUses` sur toutes les features de la réserve : une écriture
// rejouée hors-ligne ne double donc jamais une dépense.
export const useClassResources = (
  characterSheet: Ref<CharacterSheet>,
  spellSlots?: Ref<SlotsByType>,
) => {
  const toaster = useToast()
  const { offlineMutate } = useOfflineMutation(() => characterSheet.value.id)

  const rows = (featureIds: number[]) =>
    (characterSheet.value.features ?? []).filter(cf => featureIds.includes(cf.featureId))

  const persist = async (featureId: number, body: { currentUses?: number, active?: boolean }, label: string) => {
    await offlineMutate({
      endpoint: `/api/character_sheets/${characterSheet.value.id}/features`,
      method: 'PUT',
      body: [{ featureId, ...body }],
      dedupeKey: `feature:${featureId}`,
      label,
    })
  }

  const setSpent = async (group: ResourceGroup, spent: number) => {
    const next = Math.max(0, group.max === null ? spent : Math.min(spent, group.max))
    const previous = rows(group.featureIds).map(cf => ({ cf, uses: cf.currentUses }))
    for (const { cf } of previous) cf.currentUses = next
    try {
      await Promise.all(group.featureIds.map(id => persist(id, { currentUses: next }, group.name)))
    } catch {
      for (const { cf, uses } of previous) cf.currentUses = uses
      toaster.add({ title: `Erreur lors de la mise à jour — ${group.name}`, color: 'error' })
    }
  }

  const remaining = (group: ResourceGroup): number | null =>
    group.unlimited || group.max === null ? null : Math.max(0, group.max - group.spent)

  const canSpend = (group: ResourceGroup, amount: number): boolean => {
    const left = remaining(group)
    return left === null || left >= amount
  }

  const spend = async (group: ResourceGroup, amount: number): Promise<boolean> => {
    if (!canSpend(group, amount)) {
      toaster.add({ title: `${group.name} : pas assez de points`, color: 'warning' })
      return false
    }
    if (!group.unlimited) await setSpent(group, group.spent + amount)
    return true
  }

  const regain = (group: ResourceGroup, amount: number) => setSpent(group, group.spent - amount)

  // L'état actif n'est écrit que sur la feature qui le porte ; entrer en rage coûte une utilisation (sauf illimitée).
  const setActive = async (featureId: number, active: boolean, group: ResourceGroup | undefined) => {
    const cf = rows([featureId])[0]
    if (!cf) return
    if (active && group && !(await spend(group, 1))) return
    const previous = cf.active
    cf.active = active
    try {
      await persist(featureId, { active }, cf.feature?.name ?? 'Capacité')
    } catch {
      cf.active = previous
      toaster.add({ title: 'Erreur lors de la mise à jour', color: 'error' })
    }
  }

  // AideDD, Ensorceleur › Flexibilité des sorts : un emplacement sacrifié rend autant de points que son niveau.
  const convertSlotToPoints = async (group: ResourceGroup, level: number) => {
    const slot = spellSlots?.value.spellcasting[level]
    if (!slot || slot.current < 1) return
    slot.current -= 1
    await setSpent(group, pointsAfterSlotConversion(group.spent, level))
  }

  // Les points payent un emplacement créé en plus (niveau 5 au plus) ; il disparaît au repos long.
  const createSlot = async (group: ResourceGroup, level: number) => {
    const cost = slotCreationCost(level)
    const slot = spellSlots?.value.spellcasting[level]
    if (cost === null || level > SORCERY_MAX_CREATED_SLOT_LEVEL || !slot || !(await spend(group, cost))) return
    slot.max += 1
    slot.current += 1
    slot.created = (slot.created ?? 0) + 1
  }

  return { remaining, canSpend, spend, regain, setSpent, setActive, convertSlotToPoints, createSlot }
}
