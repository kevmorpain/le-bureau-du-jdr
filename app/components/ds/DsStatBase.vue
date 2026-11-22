<template>
  <div
    class="stat"
    role="group"
    :aria-label="`${label} ${value}`"
  >
    <span
      class="ds-label stat__label"
      aria-hidden="true"
    >{{ label }}</span>
    <span
      class="ds-number stat__value"
      aria-hidden="true"
    >{{ value }}</span>
  </div>
</template>

<script lang="ts" setup>
const { label, value } = defineProps<{ label: string, value: string | number }>()
</script>

<style scoped>
.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 72px;
  height: 50px;
  padding: 0 8px;
  background: var(--color-ds-panel-raised);
  border-bottom: 3px solid var(--color-ds-gold-dim);
}

.stat__label { font-size: 9px; }
.stat__value { font-size: 16px; line-height: 1.15; color: var(--color-ds-ink); }
</style>
