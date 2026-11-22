<template>
  <div
    role="tablist"
    :aria-label="label"
    class="flex flex-wrap gap-x-[18px] border-b border-ds-line"
  >
    <button
      v-for="option in options"
      :key="String(option.value)"
      type="button"
      role="tab"
      :aria-selected="option.value === model"
      class="-mb-px inline-flex cursor-pointer items-center gap-[5px] border-b-[3px] pb-[7px] pt-1.5 text-sm font-bold focus-visible:outline-2 focus-visible:outline-ds-gold"
      :class="option.value === model ? 'border-ds-gold text-ds-ink' : 'border-transparent text-ds-mute hover:text-ds-ink'"
      @click="model = option.value"
    >
      {{ option.label }}
      <em
        v-if="option.count !== undefined"
        class="text-[11px] not-italic"
        :class="option.value === model ? 'text-ds-gold' : 'text-ds-faint'"
      >{{ option.count }}</em>
    </button>
  </div>
</template>

<script lang="ts" setup generic="T extends string | number">
import type { DsOption } from './DsSegmented.vue'

defineProps<{ options: (DsOption<T> & { count?: number })[], label: string }>()
const model = defineModel<T>()
</script>
