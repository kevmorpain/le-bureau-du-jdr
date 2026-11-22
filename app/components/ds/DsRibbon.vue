<template>
  <span class="ds-cut-ribbon flex h-5 min-w-28 items-center justify-center border-y border-ds-gold-dim bg-ds-panel-raised px-5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-ds-gold">
    <slot>{{ label }}</slot>
  </span>
</template>

<script lang="ts" setup>
defineProps<{ label?: string }>()
</script>
