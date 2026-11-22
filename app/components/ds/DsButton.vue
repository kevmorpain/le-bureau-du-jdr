<template>
  <button
    :type="type"
    :disabled="disabled"
    class="ds-bevel ds-shape-point button"
    :class="[`button--${variant}`, { 'button--block': block }]"
  >
    <span class="ds-fill button__fill">
      <span class="button__label"><slot>{{ label }}</slot></span>
      <span
        v-if="detail"
        class="button__detail"
      >{{ detail }}</span>
    </span>
  </button>
</template>

<script lang="ts" setup>
export type DsButtonVariant = 'primary' | 'secondary' | 'danger'

const {
  label,
  detail,
  variant = 'primary',
  type = 'button',
  disabled = false,
  block = false,
} = defineProps<{
  label?: string
  detail?: string
  variant?: DsButtonVariant
  type?: 'button' | 'submit'
  disabled?: boolean
  block?: boolean
}>()
</script>

<style scoped>
.button {
  --ds-cut: var(--ds-cut-button);
  --ds-edge: 2px;
  --ds-fill: var(--color-ds-panel-raised);
  --label-color: var(--color-ds-gold);
  display: inline-flex;
  cursor: pointer;
}

.button--secondary {
  --ds-edge-color: var(--color-ds-gold-dim);
  --label-color: var(--color-ds-ink);
}

.button--danger {
  --ds-edge-color: var(--color-ds-bad);
  --label-color: var(--color-ds-bad);
}

.button--block { display: flex; width: 100%; }

.button:focus-visible { outline: none; --ds-fill: color-mix(in srgb, var(--color-ds-gold) 22%, var(--color-ds-panel-raised)); }
.button:enabled:active { --ds-fill: color-mix(in srgb, var(--color-ds-gold) 14%, var(--color-ds-panel-raised)); }
.button:disabled { cursor: not-allowed; opacity: 0.5; }

.button__fill {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 8px 24px;
}

.button__label {
  font-size: 13.5px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--label-color);
}

.button__detail {
  font-size: 11px;
  white-space: nowrap;
  color: var(--color-ds-mute);
}
</style>
