<template>
  <UApp :toaster>
    <NuxtPwaManifest />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <AppFooter />
  </UApp>
</template>

<script lang="ts" setup>
import { NuxtLayout } from '#components';

const toaster = { position: 'top-right' }
</script>
