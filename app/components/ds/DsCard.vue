<template>
  <component
    :is="as"
    :type="as === 'button' ? 'button' : undefined"
    :aria-pressed="as === 'button' ? selected : undefined"
    class="ds-bevel ds-shape-card card"
    :class="{ 'card--selected': selected }"
  >
    <div class="ds-fill card__fill">
      <slot />
    </div>
  </component>
</template>

<script lang="ts" setup>
const { selected = false, as = 'div' } = defineProps<{ selected?: boolean, as?: 'div' | 'button' | 'article' }>()
</script>

<style scoped>
.card {
  --ds-cut: var(--ds-cut-card);
  --ds-edge-color: linear-gradient(var(--color-ds-gold-dim) 0 2px, var(--color-ds-line) 2px);
  display: block;
  width: 100%;
  padding: 2px 1px 1px;
  text-align: left;
}

.card--selected {
  --ds-edge-color: var(--color-ds-gold);
  --ds-fill: var(--color-ds-panel-raised);
}

.card__fill {
  display: flex;
  flex-direction: column;
  gap: 4px;
  height: 100%;
  padding: 8px 11px 10px;
}
</style>
