<template>
  <DsField>
    <input
      v-model="model"
      type="text"
      :aria-label="label"
      :placeholder="placeholder"
      :maxlength="maxlength"
      class="block h-8 bg-transparent px-2.5 text-[13px] text-ds-ink placeholder:text-ds-faint focus:outline-none"
      :style="{ width: `${width}px` }"
    >
  </DsField>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{
  label: string
  placeholder?: string
  maxlength?: number
  width?: number
}>(), { placeholder: undefined, maxlength: undefined, width: 190 })

const model = defineModel<string>({ default: '' })
</script>
