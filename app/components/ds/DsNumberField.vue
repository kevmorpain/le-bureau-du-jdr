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
      class="block h-8 bg-transparent text-center font-bodoni text-lg font-bold text-ds-ink placeholder:text-ds-faint focus:outline-none"
      :style="{ width: `${width}px` }"
      @input="onInput"
    >
  </DsField>
</template>

<script lang="ts" setup>
const props = withDefaults(defineProps<{
  label: string
  min?: number
  max?: number
  step?: number
  placeholder?: string
  width?: number
}>(), { min: undefined, max: undefined, step: 1, placeholder: undefined, width: 76 })

const model = defineModel<number | null>({ default: null })

const invalid = computed(() => model.value !== null
  && ((props.min !== undefined && model.value < props.min) || (props.max !== undefined && model.value > props.max)))

const onInput = (event: Event) => {
  const raw = (event.target as HTMLInputElement).value
  const parsed = Number(raw)
  model.value = raw === '' || Number.isNaN(parsed) ? null : parsed
}
</script>
