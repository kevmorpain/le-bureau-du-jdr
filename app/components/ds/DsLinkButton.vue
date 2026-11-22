<template>
  <button
    :type="type"
    :disabled="disabled"
    class="link"
  >
    <span
      v-if="plus"
      class="ds-bevel ds-shape-corner link__plus"
      aria-hidden="true"
    >
      <span class="ds-fill link__plus-fill">+</span>
    </span>
    <slot>{{ label }}</slot>
  </button>
</template>

<script lang="ts" setup>
const { label, plus = false, type = 'button', disabled = false } = defineProps<{
  label?: string
  plus?: boolean
  type?: 'button' | 'submit'
  disabled?: boolean
}>()
</script>

<style scoped>
.link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-ds-gold);
  cursor: pointer;
}

.link:hover { color: var(--color-ds-gold-hi); }
.link:focus-visible { outline: none; text-decoration: underline; }
.link:disabled { cursor: not-allowed; opacity: 0.5; }

.link__plus {
  --ds-cut: var(--ds-cut-tag);
  --ds-edge-color: var(--color-ds-gold-dim);
  --ds-fill: var(--color-ds-bg);
  display: inline-flex;
  width: 16px;
  height: 16px;
}

.link__plus-fill {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  font-size: 12px;
  line-height: 1;
}
</style>
