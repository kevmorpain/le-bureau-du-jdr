<template>
  <span
    class="ds-bevel ds-shape-corner field"
    :class="{ 'field--invalid': invalid }"
  >
    <span class="ds-fill field__fill">
      <slot />
    </span>
  </span>
</template>

<script lang="ts" setup>
const { invalid = false } = defineProps<{ invalid?: boolean }>()
</script>

<style scoped>
.field {
  --ds-cut: var(--ds-cut-input);
  --ds-edge-color: var(--color-ds-gold-dim);
  --ds-fill: var(--color-ds-bg);
  display: inline-flex;
}

.field:focus-within { --ds-edge-color: var(--color-ds-gold); }
.field--invalid { --ds-edge-color: var(--color-ds-bad); }

.field__fill { display: flex; }

.field__fill > :slotted(input),
.field__fill > :slotted(select) {
  height: 32px;
  background-color: transparent;
  color: var(--color-ds-ink);
  outline: none;
}
</style>
