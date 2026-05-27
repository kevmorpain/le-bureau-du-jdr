<template>
  <component
    :is="tag"
    class="relative text-center py-2 px-2.5 min-w-14 rounded-lg border border-default bg-default transition-colors"
  >
    <slot />
    <p class="text-xs text-muted uppercase tracking-[0.07em] mt-0.5">
      {{ label }}
    </p>
  </component>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{
  label: string
  tag?: string
}>(), {
  tag: 'div',
})
</script>
