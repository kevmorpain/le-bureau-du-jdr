<template>
  <span
    v-if="label"
    class="text-xs text-muted tabular-nums whitespace-nowrap"
  >{{ label }}</span>
</template>

<script lang="ts" setup>
import type { InventoryEntry } from '~/composables/character/useCharacterInventory'
import { formatCostCp } from '~~/shared/rules/currency'
import { formatWeightKg, isCarried, stackWeightG } from '~~/shared/rules/encumbrance'

const props = defineProps<{ entry: InventoryEntry }>()

const label = computed(() => {
  const item = props.entry.item
  if (!item) return ''
  const carried = isCarried(item.itemType, (item.properties as { category?: string }).category)
  const lotSize = item.lotSize ?? 1
  const weight = stackWeightG({ quantity: props.entry.quantity, weightG: item.weightG ?? null, lotSize, carried })
  const cost = item.costCp == null ? null : `${formatCostCp(item.costCp)}${lotSize > 1 ? ` les ${lotSize}` : ''}`
  return [weight > 0 ? formatWeightKg(weight) : null, cost].filter(Boolean).join(' · ')
})
</script>
