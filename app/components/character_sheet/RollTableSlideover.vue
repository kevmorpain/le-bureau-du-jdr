<template>
  <USlideover
    v-model:open="open"
    :title="table?.name ?? 'Table'"
    :ui="{ body: 'p-0 sm:p-0' }"
  >
    <template #body>
      <RollTablePanel
        v-if="table"
        :table="table"
      />
      <p
        v-else-if="error"
        class="p-4 text-sm text-error"
      >
        Impossible de charger la table.
      </p>
      <div
        v-else
        class="space-y-2 p-4"
      >
        <USkeleton
          v-for="i in 6"
          :key="i"
          class="h-8 w-full"
        />
      </div>
    </template>
  </USlideover>
</template>

<script lang="ts" setup>
import type { RollTable } from '~~/shared/rules/rollTables'

const props = defineProps<{
  rollTableId: number
}>()

const open = defineModel<boolean>('open', { default: false })

const { data: table, error } = useFetch<RollTable>(`/api/catalog/roll-tables/${props.rollTableId}`)
</script>
