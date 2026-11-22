<template>
  <label class="group inline-flex cursor-pointer items-center gap-2.5 text-[12.5px] text-ds-ink has-disabled:cursor-not-allowed has-disabled:opacity-50">
    <input
      v-model="model"
      type="checkbox"
      class="peer sr-only"
      :disabled="disabled"
    >
    <DsDiamond
      class="mx-0.5 group-has-focus-visible:outline-2 group-has-focus-visible:outline-offset-2 group-has-focus-visible:outline-ds-gold"
      :state="model ? 'full' : 'empty'"
    />
    <slot>{{ label }}</slot>
  </label>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{ label?: string, disabled?: boolean }>(), { label: undefined, disabled: false })

const model = defineModel<boolean>({ default: false })
</script>
