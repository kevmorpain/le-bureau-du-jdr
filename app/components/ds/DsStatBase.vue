<template>
  <div
    class="flex h-[50px] min-w-[72px] flex-col items-center justify-center gap-0.5 border-b-[3px] border-ds-gold-dim bg-ds-panel-raised px-2"
    role="group"
    :aria-label="`${label} ${value}`"
  >
    <span
      class="ds-label text-[9px]"
      aria-hidden="true"
    >{{ label }}</span>
    <span
      class="font-bodoni text-base font-bold leading-tight text-ds-ink"
      aria-hidden="true"
    >{{ value }}</span>
  </div>
</template>

<script lang="ts" setup>
defineProps<{ label: string, value: string | number }>()
</script>
