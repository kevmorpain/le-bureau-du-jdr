<template>
  <abbr
    class="ds-shape-corner cost"
    :class="`cost--${cost}`"
    :title="$t(`ds.cost.${cost}.name`)"
    :aria-label="$t(`ds.cost.${cost}.name`)"
  >{{ $t(`ds.cost.${cost}.letter`) }}</abbr>
</template>

<script lang="ts" setup>
export type DsCost = 'action' | 'bonus' | 'reaction'

const { cost } = defineProps<{ cost: DsCost }>()
</script>

<style scoped>
.cost {
  --ds-cut: var(--ds-cut-tag);
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 17px;
  height: 17px;
  font-size: 10px;
  font-weight: 700;
  text-decoration: none;
  color: var(--color-ds-bg);
}

.cost--action { background: var(--color-ds-action); }
.cost--bonus { background: var(--color-ds-bonus); }
.cost--reaction { background: var(--color-ds-reaction); }
</style>
