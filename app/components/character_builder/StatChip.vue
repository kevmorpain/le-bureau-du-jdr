<template>
  <div class="text-center bg-(--ui-bg) rounded-md py-1.5 px-1">
    <p class="font-bold font-mono text-sm leading-none text-(--ui-text)">{{ value }}</p>
    <p class="text-xs text-muted mt-0.5 leading-none">{{ label }}</p>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  label: string
  value: string
}>()
</script>
