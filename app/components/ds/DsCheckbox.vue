<template>
  <label
    class="checkbox"
    :class="{ 'checkbox--disabled': disabled }"
  >
    <input
      v-model="model"
      type="checkbox"
      class="checkbox__input"
      :disabled="disabled"
    >
    <DsDiamond
      class="checkbox__box"
      :state="model ? 'filled' : 'empty'"
    />
    <slot>{{ label }}</slot>
  </label>
</template>

<script lang="ts" setup>
const { label, disabled = false } = defineProps<{ label?: string, disabled?: boolean }>()

const model = defineModel<boolean>({ default: false })
</script>

<style scoped>
.checkbox {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-size: 12.5px;
  color: var(--color-ds-ink);
  cursor: pointer;
}

.checkbox--disabled { cursor: not-allowed; opacity: 0.5; }

.checkbox__input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.checkbox__box { margin: 0 2px; }

.checkbox__input:focus-visible + .checkbox__box {
  outline: 2px solid var(--color-ds-gold);
  outline-offset: 2px;
}
</style>
