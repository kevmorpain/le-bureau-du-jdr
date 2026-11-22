<template>
  <component
    :is="as"
    class="group-title"
  >
    <slot>{{ label }}</slot>
  </component>
</template>

<script lang="ts" setup>
const { label, as = 'h3' } = defineProps<{ label?: string, as?: string }>()
</script>

<style scoped>
.group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-ds-gold);
}

.group-title::after {
  content: '';
  flex: 1;
  height: 7px;
  background:
    linear-gradient(var(--color-ds-gold-dim), var(--color-ds-gold-dim)) 100% 0 / 100% 1px no-repeat,
    linear-gradient(var(--color-ds-gold-dim), var(--color-ds-gold-dim)) 100% 3px / 70% 1px no-repeat,
    linear-gradient(var(--color-ds-gold-dim), var(--color-ds-gold-dim)) 100% 6px / 40% 1px no-repeat;
}
</style>
