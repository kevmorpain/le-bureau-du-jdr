<template>
  <button
    type="button"
    :aria-label="label"
    :aria-pressed="toggle ? active : undefined"
    class="ds-bevel ds-shape-corner corner"
    :class="{ 'corner--active': active }"
  >
    <span
      class="ds-fill corner__fill"
      aria-hidden="true"
    >
      <slot>{{ ICONS[icon] }}</slot>
    </span>
  </button>
</template>

<script lang="ts" setup>
export type DsCornerIcon = 'close' | 'favorite'

const { label, icon = 'close', active = false, toggle = false } = defineProps<{
  label: string
  icon?: DsCornerIcon
  active?: boolean
  toggle?: boolean
}>()

const ICONS: Record<DsCornerIcon, string> = {
  close: '✕',
  favorite: '★',
}
</script>

<style scoped>
.corner {
  --ds-cut: var(--ds-cut-control);
  --ds-edge-color: var(--color-ds-gold-dim);
  --ds-fill: var(--color-ds-panel-raised);
  display: inline-flex;
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  color: var(--color-ds-mute);
  cursor: pointer;
}

.corner:hover { color: var(--color-ds-ink); }
.corner:focus-visible { outline: none; --ds-edge-color: var(--color-ds-gold); }
.corner--active { color: var(--color-ds-gold); }

.corner__fill {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  font-size: 14px;
}
</style>
