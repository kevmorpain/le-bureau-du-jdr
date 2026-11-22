<template>
  <span class="ribbon">
    <slot>{{ label }}</slot>
  </span>
</template>

<script lang="ts" setup>
const { label } = defineProps<{ label?: string }>()
</script>

<style scoped>
.ribbon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 20px;
  min-width: 110px;
  padding: 0 20px;
  background: var(--color-ds-panel-raised);
  border-block: 1px solid var(--color-ds-gold-dim);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-ds-gold);
  clip-path: polygon(0 0, 100% 0, calc(100% - 8px) 50%, 100% 100%, 0 100%, 8px 50%);
}
</style>
