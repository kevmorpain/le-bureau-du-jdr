<template>
  <DsField>
    <input
      v-model="model"
      type="text"
      :aria-label="label"
      :placeholder="placeholder"
      :maxlength="maxlength"
      class="text"
      :style="{ width: `${width}px` }"
    >
  </DsField>
</template>

<script lang="ts" setup>
const { label, placeholder, maxlength, width = 190 } = defineProps<{
  label: string
  placeholder?: string
  maxlength?: number
  width?: number
}>()

const model = defineModel<string>({ default: '' })
</script>

<style scoped>
.text {
  padding: 0 10px;
  font-size: 13px;
}

.text::placeholder { color: var(--color-ds-faint); }
</style>
