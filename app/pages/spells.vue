<template>
  <UHeader>
    <template #left>
      <Logo class="w-auto h-10 shrink-0" />
    </template>

    <UNavigationMenu
      :items="items"
      class="justify-center"
    />

    <template #right>
      <CharacterSheetDrawer
        class="ml-auto"
      />
    </template>
  </UHeader>

  <UMain>
    <UPage>
      <UContainer>
        <NuxtPage />
      </UContainer>
    </UPage>
  </UMain>
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
