<template>
  <UPageBody>
    <div class="space-y-4">
      <div class="flex items-end space-x-4">
        <SpellFilters />

        <UTabs
          v-model="selectedList"
          class="w-min ml-auto"
          :items="listItems"
          :content="false"
        />
      </div>

      <div>
        <Component
          :is="selectedComponent"
          :spells="filteredData"
        />
      </div>
    </div>
  </UPageBody>
</template>

<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import { CardList, TableList } from '#components'

const listItems: TabsItem[] = [
  { icon: 'heroicons-outline:view-columns', value: 'card' },
  { icon: 'heroicons-outline:list-bullet', value: 'table' },
]

const selectedList = ref<'card' | 'table'>('card')
const selectedComponent = computed(() => {
  return selectedList.value === 'card' ? CardList : TableList
})

const { data } = await useFetch<Spell[]>('/api/spells')

const { filters } = useSpellFilters()

const filteredData = computed(() => {
  let spells = data.value || []

  if (filters.levels.length > 0) {
    spells = spells.filter(spell => filters.levels.includes(spell.level))
  }

  if (filters.concentration !== 'both') {
    spells = spells.filter(spell => filters.concentration === String(spell.concentration))
  }

  if (filters.ritual !== 'both') {
    spells = spells.filter(spell => filters.ritual === String(spell.ritual))
  }

  if (filters.castingTime.length > 0) {
    spells = spells.filter((spell) => {
      const otherCastingTimes = filters.castingTime.filter(ct => ct !== 'other')

      if (filters.castingTime.includes('other')) {
        return otherCastingTimes.includes(spell.castingTime) || !['1 action', '1 action bonus', '1 réaction'].includes(spell.castingTime)
      }

      return filters.castingTime.includes(spell.castingTime)
    })
  }

  if (filters.components.length > 0) {
    spells = spells.filter((spell) => {
      return filters.components.every(component => spell.components.includes(component)) && filters.components.length === spell.components.length
    })
  }

  return spells
})
</script>
