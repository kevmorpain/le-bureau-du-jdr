<template>
  <div
    class="ds-cut-shield box-border h-[62px] w-[58px] bg-ds-gold px-px pb-[3px] pt-px"
    role="group"
    :aria-label="`${label} ${value}`"
  >
    <div class="ds-cut-shield box-border flex h-full flex-col items-center bg-ds-panel-raised pt-[7px]">
      <span
        class="ds-label text-[9px]"
        aria-hidden="true"
      >{{ label }}</span>
      <span
        class="font-bodoni text-[17px] font-bold leading-tight text-ds-ink"
        aria-hidden="true"
      >{{ value }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{ label: string, value: string | number }>()
</script>
