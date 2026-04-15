<template>
  <span
    class="size-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
    :class="{
      'border-muted bg-transparent': level === 'none',
      'border-primary bg-primary': level === 'proficient',
      'border-primary bg-transparent ring-1 ring-primary ring-offset-1': level === 'expert',
    }"
  />
</template>

<script lang="ts" setup>
defineProps<{
  level: 'none' | 'proficient' | 'expert'
}>()
</script>
