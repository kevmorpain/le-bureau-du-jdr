<template>
  <UTooltip
    v-if="lines.length"
    :text="lines.join('\n')"
    :ui="{ text: 'whitespace-pre-line', content: 'h-auto' }"
  >
    <UIcon
      name="i-heroicons:exclamation-triangle-16-solid"
      class="size-3 text-rose-400 shrink-0"
    />
  </UTooltip>
</template>

<script lang="ts" setup>
defineProps<{ lines: string[] }>()
</script>
