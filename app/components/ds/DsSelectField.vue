<template>
  <DsField>
    <select
      :value="model === undefined ? '' : String(model)"
      :aria-label="label"
      class="select"
      :class="{ 'select--empty': model === undefined }"
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

const { options, label, placeholder, width = 190 } = defineProps<{
  options: DsOption<T>[]
  label: string
  placeholder?: string
  width?: number
}>()

const model = defineModel<T>()

// Le <select> natif ne rend que des chaînes : on retrouve la valeur typée de l'option choisie.
const onChange = (event: Event) => {
  const raw = (event.target as HTMLSelectElement).value
  const option = options.find(o => String(o.value) === raw)
  if (option) model.value = option.value
}
</script>

<style scoped>
.select {
  appearance: none;
  padding: 0 32px 0 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5l5 5 5-5' fill='none' stroke='%23d8ad5c' stroke-width='1.8'/%3E%3C/svg%3E") no-repeat right 12px center;
}

.field__fill > .select.select--empty { color: var(--color-ds-faint); }

.select option {
  background: var(--color-ds-panel);
  color: var(--color-ds-ink);
}
</style>
