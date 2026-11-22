<template>
  <button
    :type="type"
    :disabled="disabled"
    class="inline-flex cursor-pointer items-center gap-1.5 px-2 py-1 text-xs font-bold text-ds-gold hover:text-ds-gold-hi focus-visible:underline focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
  >
    <span
      v-if="plus"
      class="ds-cut-corner inline-flex size-4 items-center justify-center bg-ds-gold-dim p-px [--ds-cut:4px]"
      aria-hidden="true"
    >
      <span class="ds-cut-corner flex size-full items-center justify-center bg-ds-bg text-xs leading-none [--ds-cut:3.6px]">+</span>
    </span>
    <slot>{{ label }}</slot>
  </button>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{
  label?: string
  plus?: boolean
  type?: 'button' | 'submit'
  disabled?: boolean
}>(), { label: undefined, plus: false, type: 'button', disabled: false })
</script>
