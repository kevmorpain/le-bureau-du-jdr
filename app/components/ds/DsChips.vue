<template>
  <div
    role="group"
    :aria-label="label"
    class="chips"
  >
    <button
      v-for="option in options"
      :key="String(option.value)"
      type="button"
      :aria-pressed="isOn(option.value)"
      class="ds-bevel ds-shape-corner chip"
      :class="{ 'chip--on': isOn(option.value) }"
      @click="toggle(option.value)"
    >
      <span class="ds-fill chip__fill">{{ option.label }}</span>
    </button>
  </div>
</template>

<script lang="ts" setup generic="T extends string | number">
import type { DsOption } from './DsSegmented.vue'

const { options, label } = defineProps<{ options: DsOption<T>[], label: string }>()
const model = defineModel<T[]>({ default: () => [] })

const isOn = (value: T) => model.value.includes(value)
const toggle = (value: T) => {
  model.value = isOn(value) ? model.value.filter(v => v !== value) : [...model.value, value]
}
</script>

<style scoped>
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  --ds-cut: var(--ds-cut-input);
  --ds-edge-color: var(--color-ds-line);
  --ds-fill: var(--color-ds-panel-raised);
  display: inline-flex;
  color: var(--color-ds-mute);
  cursor: pointer;
}

.chip:hover { color: var(--color-ds-ink); }
.chip:focus-visible { outline: none; --ds-edge-color: var(--color-ds-gold-dim); }

.chip--on {
  --ds-edge-color: var(--color-ds-gold);
  --ds-fill: color-mix(in srgb, var(--color-ds-gold) 14%, var(--color-ds-panel-raised));
  color: var(--color-ds-ink);
}

.chip--on:focus-visible { --ds-edge-color: var(--color-ds-gold-hi); }

.chip__fill {
  padding: 6px 12px;
  font-size: 12.5px;
  font-weight: 700;
}
</style>
