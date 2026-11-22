<template>
  <DsField :invalid="invalid">
    <input
      :value="model ?? ''"
      type="number"
      inputmode="numeric"
      :min="min"
      :max="max"
      :step="step"
      :aria-label="label"
      :aria-invalid="invalid || undefined"
      :placeholder="placeholder"
      class="ds-number number"
      :style="{ width: `${width}px` }"
      @input="onInput"
    >
  </DsField>
</template>

<script lang="ts" setup>
const { label, min, max, step = 1, placeholder, width = 76 } = defineProps<{
  label: string
  min?: number
  max?: number
  step?: number
  placeholder?: string
  width?: number
}>()

const model = defineModel<number | null>({ default: null })

const invalid = computed(() => model.value !== null
  && ((min !== undefined && model.value < min) || (max !== undefined && model.value > max)))

const onInput = (event: Event) => {
  const raw = (event.target as HTMLInputElement).value
  const parsed = Number(raw)
  model.value = raw === '' || Number.isNaN(parsed) ? null : parsed
}
</script>

<style scoped>
.number {
  font-size: 18px;
  text-align: center;
}

.number::placeholder { color: var(--color-ds-faint); }
</style>
