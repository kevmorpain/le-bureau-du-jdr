<template>
  <div class="flex flex-wrap items-center gap-2">
    <h2 class="text-xs font-bold uppercase tracking-widest text-muted">
      {{ title }}
    </h2>
    <UTooltip
      v-if="$slots.default"
      :ui="{ content: 'h-auto max-w-sm whitespace-normal py-2' }"
    >
      <button
        type="button"
        class="inline-flex cursor-help items-center text-muted hover:text-default"
        :aria-label="`À propos : ${title}`"
      >
        <UIcon
          name="i-heroicons:information-circle"
          class="size-4"
        />
      </button>
      <template #content>
        <p class="text-sm">
          <slot />
        </p>
      </template>
    </UTooltip>
    <slot name="extra" />
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  title: string
}>()
</script>
