import type { SlotsByType } from './useCharacterSpellcasting'
import { resourceFeaturesOf, restRecovery } from '~~/shared/rules/classResources'
import { hitDiceTotals, recoverHitDice, remainingHitDice } from '~~/shared/rules/hitDice'
import { REST_RECHARGE_MAP, type RestType } from '~~/shared/utils/rest'

export type RestRecapRow
  = | { key: string, label: string, kind: 'counter', remaining: number, max: number, regained: number, possible: number, note?: string }
    | { key: string, label: string, kind: 'text', text: string }

// What a rest gives back, read with the same rules the server applies (`characterRest`), before anything is applied.
export const useRestRecap = (characterSheet: Ref<CharacterSheet>, spellSlots: Ref<SlotsByType>) => {
  const { t } = useI18n()
  const { resolvedFeatures, resourceGroups, inventory, exhaustionLevel } = useCharacterSheet(characterSheet)

  const counter = (key: string, label: string, remaining: number, max: number, regained: number, possible = 0, note?: string): RestRecapRow =>
    ({ key, label, kind: 'counter', remaining, max, regained, possible, note })
  const text = (key: string, label: string, value: string): RestRecapRow => ({ key, label, kind: 'text', text: value })

  const slotRows = (rest: RestType) => {
    const types = rest === 'short' ? (['pact_magic'] as const) : rest === 'long' ? (['pact_magic', 'spellcasting'] as const) : []
    return types.flatMap(slotType => Object.entries(spellSlots.value[slotType] ?? {})
      .filter(([, slot]) => slot.max > 0 && slot.current < slot.max)
      .map(([level, slot]) => counter(
        `slot-${slotType}-${level}`,
        t(slotType === 'pact_magic' ? 'sheet.play.slot.pact' : 'sheet.play.slot.level', { level }),
        slot.current,
        slot.max,
        slot.max - slot.current,
      )))
  }

  const featureRows = (rest: RestType) => {
    const recovery = restRecovery(resourceFeaturesOf(characterSheet.value.features ?? []), characterSheet.value.classes ?? [], rest)
    const regainedOf = (id: number, spent: number) =>
      recovery.reset.includes(id) ? spent : Math.min(spent, recovery.regain.find(r => r.featureId === id)?.amount ?? 0)

    const grouped = new Set(resourceGroups.value.flatMap(group => group.featureIds))
    const groups = resourceGroups.value
      .filter(group => group.max !== null && !group.unlimited)
      .map(group => ({ key: `group-${group.key}`, name: group.name, max: group.max!, spent: Math.min(group.spent, group.max!), regained: Math.min(group.max!, regainedOf(group.primaryId, group.spent)) }))
    const singles = resolvedFeatures.value
      .filter(feature => !grouped.has(feature.id) && feature.maxUses !== null && !feature.unlimited)
      .map(feature => ({ key: `feature-${feature.id}`, name: feature.name, max: feature.maxUses!, spent: Math.min(feature.currentUses, feature.maxUses!), regained: regainedOf(feature.id, Math.min(feature.currentUses, feature.maxUses!)) }))

    return [...groups, ...singles]
      .filter(row => row.regained > 0)
      .map(row => counter(row.key, row.name, row.max - row.spent + row.regained, row.max, row.regained))
  }

  const itemRows = (rest: RestType) => (inventory.value ?? [])
    .filter(entry => entry.item?.rechargeType && REST_RECHARGE_MAP[rest].includes(entry.item.rechargeType) && entry.currentUses > 0 && entry.item.maxUses)
    .map((entry) => {
      const max = entry.item!.maxUses!
      const remaining = Math.max(0, max - entry.currentUses)
      return entry.item!.rechargeDice
        ? counter(`item-${entry.id}`, entry.item!.name, remaining, max, 0, entry.currentUses, t('sheet.rest.recap.rolled_on_rest', { dice: entry.item!.rechargeDice }))
        : counter(`item-${entry.id}`, entry.item!.name, max, max, entry.currentUses)
    })

  const hitDiceRows = () => {
    const totals = hitDiceTotals((characterSheet.value.classes ?? []).map(cls => ({ level: cls.level, hitDice: cls.class?.hitDice })))
    const before = remainingHitDice(characterSheet.value.currentHitDie, totals)
    const after = recoverHitDice(before, totals)
    return totals.flatMap(({ die, count }) => {
      const now = before.find(d => d.die === die)?.count ?? count
      const regained = (after.find(d => d.die === die)?.count ?? now) - now
      return regained > 0 ? [counter(`hit-dice-${die}`, t('sheet.rest.recap.hit_dice', { die }), now + regained, count, regained)] : []
    })
  }

  const endingRows = (rest: RestType) => rest === 'dawn'
    ? []
    : resolvedFeatures.value.filter(feature => feature.active).map(feature => text(`ending-${feature.id}`, feature.name, t('sheet.rest.recap.ends')))

  const longRows = (fedAndWatered: boolean) => [
    ...(characterSheet.value.deathSaveSuccesses || characterSheet.value.deathSaveFailures
      ? [text('death-saves', t('sheet.rest.recap.death_saves'), t('sheet.rest.recap.reset'))]
      : []),
    ...(exhaustionLevel.value > 0
      ? [text('exhaustion', t('sheet.rest.recap.exhaustion'), fedAndWatered
          ? t('sheet.rest.recap.exhaustion_down', { from: exhaustionLevel.value, to: exhaustionLevel.value - 1 })
          : t('sheet.rest.recap.exhaustion_kept'))]
      : []),
  ]

  const recapFor = (rest: RestType, { fedAndWatered = true } = {}): RestRecapRow[] => [
    ...(rest === 'long' ? hitDiceRows() : []),
    ...slotRows(rest),
    ...featureRows(rest),
    ...itemRows(rest),
    ...(rest === 'long' ? longRows(fedAndWatered) : []),
    ...endingRows(rest),
  ]

  return { recapFor }
}
