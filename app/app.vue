<template>
  <UApp :toaster>
    <NuxtPwaManifest />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script lang="ts" setup>
import { NuxtLayout } from '#components';

const toaster = { position: 'top-right' }
</script>
