<template>
  <DsField>
    <select
      :value="model === undefined ? '' : String(model)"
      :aria-label="label"
      class="ds-select block h-8 cursor-pointer appearance-none bg-transparent pl-3 pr-8 text-[13px] font-bold focus:outline-none"
      :class="model === undefined ? 'text-ds-faint' : 'text-ds-ink'"
      :style="{ width: `${width}px` }"
      @change="onChange"
    >
      <option
        v-if="placeholder"
        value=""
        disabled
      >
        {{ placeholder }}
      </option>
      <option
        v-for="option in options"
        :key="String(option.value)"
        :value="String(option.value)"
      >
        {{ option.label }}
      </option>
    </select>
  </DsField>
</template>

<script lang="ts" setup generic="T extends string | number">
import type { DsOption } from './DsSegmented.vue'

const props = withDefaults(defineProps<{
  options: DsOption<T>[]
  label: string
  placeholder?: string
  width?: number
}>(), { placeholder: undefined, width: 190 })

const model = defineModel<T>()

// Le <select> natif ne rend que des chaînes : on retrouve la valeur typée de l'option choisie.
const onChange = (event: Event) => {
  const raw = (event.target as HTMLSelectElement).value
  const option = props.options.find(o => String(o.value) === raw)
  if (option) model.value = option.value
}
</script>

<style scoped>
.ds-select {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5l5 5 5-5' fill='none' stroke='%23d8ad5c' stroke-width='1.8'/%3E%3C/svg%3E") no-repeat right 12px center;
}

.ds-select option {
  background: var(--color-ds-panel);
  color: var(--color-ds-ink);
}
</style>
