<template>
  <component
    :is="as"
    class="ds-group-title flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-ds-gold"
  >
    <slot>{{ label }}</slot>
  </component>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{ label?: string, as?: string }>(), { label: undefined, as: 'h3' })
</script>

<style scoped>
.ds-group-title::after {
  content: '';
  flex: 1;
  height: 7px;
  background:
    linear-gradient(var(--color-ds-gold-dim), var(--color-ds-gold-dim)) 100% 0 / 100% 1px no-repeat,
    linear-gradient(var(--color-ds-gold-dim), var(--color-ds-gold-dim)) 100% 3px / 70% 1px no-repeat,
    linear-gradient(var(--color-ds-gold-dim), var(--color-ds-gold-dim)) 100% 6px / 40% 1px no-repeat;
}
</style>
