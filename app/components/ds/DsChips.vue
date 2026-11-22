<template>
  <div
    role="group"
    :aria-label="label"
    class="flex flex-wrap gap-1.5"
  >
    <button
      v-for="option in options"
      :key="String(option.value)"
      type="button"
      :aria-pressed="isOn(option.value)"
      class="group ds-cut-corner inline-flex cursor-pointer p-px [--ds-cut:6px] focus-visible:outline-none"
      :class="isOn(option.value) ? 'bg-ds-gold' : 'bg-ds-line focus-visible:bg-ds-gold-dim'"
      @click="toggle(option.value)"
    >
      <span
        class="ds-cut-corner px-3 py-1.5 text-[12.5px] font-bold [--ds-cut:5.5px]"
        :class="isOn(option.value)
          ? 'bg-[color-mix(in_srgb,var(--color-ds-gold)_14%,var(--color-ds-panel-raised))] text-ds-ink'
          : 'bg-ds-panel-raised text-ds-mute group-hover:text-ds-ink'"
      >{{ option.label }}</span>
    </button>
  </div>
</template>

<script lang="ts" setup generic="T extends string | number">
import type { DsOption } from './DsSegmented.vue'

defineProps<{ options: DsOption<T>[], label: string }>()
const model = defineModel<T[]>({ default: () => [] })

const isOn = (value: T) => model.value.includes(value)
const toggle = (value: T) => {
  model.value = isOn(value) ? model.value.filter(v => v !== value) : [...model.value, value]
}
</script>
