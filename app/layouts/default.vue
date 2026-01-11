<template>
  <UHeader>
    <template #left>
      <NuxtLink to="/">
        <Logo class="w-auto h-10 shrink-0" />
      </NuxtLink>
    </template>

    <UNavigationMenu
      :items="items"
    />

    <template #body>
      <UNavigationMenu
        :items
        orientation="vertical"
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
    label: 'Personnage',
    icon: 'heroicons-outline:identification',
    to: '/character/1',
  },
  {
    label: 'Sorts',
    icon: 'heroicons-outline:book-open',
    to: '/spells',
  },
])
</script>
