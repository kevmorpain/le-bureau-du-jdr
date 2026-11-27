<template>
  <span
    v-if="label"
    class="text-xs text-muted tabular-nums whitespace-nowrap"
  >{{ label }}</span>
</template>

<script lang="ts" setup>
import type { InventoryEntry } from '~/composables/character/useCharacterInventory'
import { formatCostCp } from '~~/shared/rules/currency'
import { formatWeightKg } from '~~/shared/rules/encumbrance'
import { entryWeightG } from '~/utils/inventoryView'

const props = defineProps<{ entry: InventoryEntry }>()

const label = computed(() => {
  const item = props.entry.item
  if (!item) return ''
  const lotSize = item.lotSize ?? 1
  const weight = entryWeightG(props.entry)
  const cost = item.costCp == null ? null : `${formatCostCp(item.costCp)}${lotSize > 1 ? ` les ${lotSize}` : ''}`
  return [weight > 0 ? formatWeightKg(weight) : null, cost].filter(Boolean).join(' · ')
})
</script>
