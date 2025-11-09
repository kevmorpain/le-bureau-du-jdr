<template>
  <UApp :toaster>
    <NuxtPwaManifest />
    <NuxtPage />
  </UApp>
</template>

<script lang="ts" setup>
const toaster = { position: 'top-right' }
</script>
