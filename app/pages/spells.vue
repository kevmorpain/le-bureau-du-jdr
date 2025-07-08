<template>
  <UContainer>
    <UNavigationMenu
      :items="items"
      class="w-full justify-center"
    />

    <NuxtPage />
  </UContainer>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const items = ref<NavigationMenuItem[]>([
  {
    label: 'Tous les sorts',
    icon: 'heroicons-outline:book-open',
    to: '/spells',
    exact: true,
  },
  {
    label: 'Mes sorts',
    icon: 'heroicons-outline:bookmark-square',
    to: '/spells/spellbook',
    exact: true,
  },
  {
    label: 'Ajouter un sort',
    icon: 'heroicons-outline:plus-circle',
    to: '/spells/new',
    exact: true,
  },
])
</script>
