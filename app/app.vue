<template>
  <UApp :toaster>
    <NuxtPwaManifest />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <AppFooter v-if="route.meta.footer !== false" />
  </UApp>
</template>

<script lang="ts" setup>
import { NuxtLayout } from '#components'

const toaster = { position: 'top-right' }
const route = useRoute()
</script>
