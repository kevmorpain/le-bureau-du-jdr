<template>
  <UHeader>
    <template #left>
      <NuxtLink to="/">
        <Logo class="w-auto h-10 shrink-0" />
      </NuxtLink>
    </template>

    <UNavigationMenu
      :items
    />

    <template #body>
      <UNavigationMenu
        :items
        orientation="vertical"
      />
    </template>

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

<script lang="ts" setup>
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
