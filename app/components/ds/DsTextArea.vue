<template>
  <DsField class="area">
    <textarea
      v-model="model"
      :aria-label="label"
      :placeholder="placeholder"
      :rows="rows"
      class="area__input"
    />
  </DsField>
</template>

<script lang="ts" setup>
const { label, placeholder, rows = 3 } = defineProps<{
  label: string
  placeholder?: string
  rows?: number
}>()

const model = defineModel<string>({ default: '' })
</script>

<style scoped>
.area {
  display: flex;
  width: 100%;
}

.area :deep(.field__fill) { flex: 1; }

.area__input {
  width: 100%;
  padding: 8px 10px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--color-ds-ink);
  background: transparent;
  outline: none;
  resize: vertical;
}

.area__input::placeholder { color: var(--color-ds-faint); }
</style>
