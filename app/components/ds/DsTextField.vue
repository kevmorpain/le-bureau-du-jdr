<template>
  <DsField>
    <DsIcon
      v-if="icon"
      :name="icon"
      :size="13"
      class="text__icon"
    />
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
import type { DsIconName } from './DsIcon.vue'

const { label, placeholder, maxlength, width = 190, icon } = defineProps<{
  label: string
  placeholder?: string
  maxlength?: number
  width?: number
  icon?: DsIconName
}>()

const model = defineModel<string>({ default: '' })
</script>

<style scoped>
.text {
  padding: 0 10px;
  font-size: 13px;
}

.text::placeholder { color: var(--color-ds-faint); }

.text__icon {
  align-self: center;
  margin-left: 10px;
  color: var(--color-ds-faint);
}

.text__icon + .text { padding-left: 6px; }
</style>
