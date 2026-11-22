<template>
  <section
    class="relative flex flex-col gap-2 border-[1.5px] border-ds-gold-dim bg-ds-panel px-3.5 pb-3 pt-3.5 shadow-[inset_0_0_0_3px_var(--color-ds-panel),inset_0_0_0_4px_var(--color-ds-line)]"
    :class="{ 'mt-2.5': ribbon }"
    :aria-label="ribbon"
  >
    <DsRibbon
      v-if="ribbon"
      class="-mt-6 self-center"
      :label="ribbon"
    />
    <slot />
  </section>
</template>

<script lang="ts" setup>
defineProps<{ ribbon?: string }>()
</script>
