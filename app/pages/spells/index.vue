<template>
  <div class="space-y-4">
    <UTabs
      v-model="selectedList"
      class="w-min ml-auto"
      :items="listItems"
      :content="false"
    />

    <div v-if="data">
      <Component
        :is="selectedComponent"
        :spells="data"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import { CardList, TableList } from '#components'

const { data } = await useFetch<Spell[]>('/api/spells')

const listItems: TabsItem[] = [
  { icon: 'heroicons-outline:view-columns', value: 'card' },
  { icon: 'heroicons-outline:list-bullet', value: 'table' },
]

const selectedList = ref<'card' | 'table'>('card')
const selectedComponent = computed(() => {
  return selectedList.value === 'card' ? CardList : TableList
})
</script>
