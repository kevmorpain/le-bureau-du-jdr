<template>
  <RollTablePanel
    v-if="table"
    :table
    inline
  />
  <p
    v-else-if="error"
    class="text-sm text-error"
  >
    Impossible de charger la table.
  </p>
  <USkeleton
    v-else
    class="h-24 w-full"
  />
</template>

<script lang="ts" setup>
import type { RollTable } from '~~/shared/rules/rollTables'

const props = defineProps<{
  rollTableId: number
}>()

const { data: table, error } = useFetch<RollTable>(`/api/catalog/roll-tables/${props.rollTableId}`)
</script>
