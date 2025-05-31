<template>
  <UContainer>
    <UNavigationMenu :items="items" class="w-full justify-center" />

    <NuxtPage />
  </UContainer>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const items = ref<NavigationMenuItem[]>([
  {
    label: 'Spells',
    icon: 'heroicons-outline:book-open',
    to: '/spells',
    exact: true,
  },
  {
    label: 'Add Spell',
    icon: 'heroicons-outline:plus-circle',
    to: '/spells/new',
    exact: true,
  },
])
</script>
