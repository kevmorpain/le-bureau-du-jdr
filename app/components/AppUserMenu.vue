<template>
  <UDropdownMenu
    v-if="loggedIn"
    :items="menuItems"
  >
    <UButton
      :avatar="user?.avatar ? { src: user.avatar } : undefined"
      :icon="user?.avatar ? undefined : 'heroicons:user-circle'"
      :label="user?.name"
      color="neutral"
      variant="ghost"
      trailing-icon="heroicons:chevron-down-20-solid"
    />
  </UDropdownMenu>

  <UButton
    v-else
    to="/login"
    label="Connexion"
    icon="heroicons:arrow-right-on-rectangle"
    color="neutral"
    variant="subtle"
  />
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const { loggedIn, user } = useUserSession()
const { logout } = useLogout()

const menuItems = computed<DropdownMenuItem[][]>(() => [
  [{ label: user.value?.name ?? 'Mon compte', type: 'label' }],
  [{
    label: 'Déconnexion',
    icon: 'heroicons:arrow-left-on-rectangle',
    onSelect: () => logout(),
  }],
])
</script>
