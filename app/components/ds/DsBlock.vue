<template>
  <section
    class="block"
    :class="{ 'block--ribbon': ribbon }"
    :aria-label="ribbon"
  >
    <DsRibbon
      v-if="ribbon"
      class="block__ribbon"
      :label="ribbon"
    />
    <slot />
  </section>
</template>

<script lang="ts" setup>
const { ribbon } = defineProps<{ ribbon?: string }>()
</script>

<style scoped>
.block {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 14px 14px 12px;
  background: var(--color-ds-panel);
  border: 1.5px solid var(--color-ds-gold-dim);
  box-shadow: inset 0 0 0 3px var(--color-ds-panel), inset 0 0 0 4px var(--color-ds-line);
}

.block--ribbon { margin-top: 10px; }

.block__ribbon {
  align-self: center;
  margin-top: -24px;
}
</style>
