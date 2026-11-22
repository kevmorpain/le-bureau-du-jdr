<template>
  <abbr
    class="ds-cut-corner inline-flex size-[17px] shrink-0 items-center justify-center text-[10px] font-bold text-ds-bg no-underline [--ds-cut:4px]"
    :class="COSTS[cost].class"
    :title="COSTS[cost].name"
    :aria-label="COSTS[cost].name"
  >{{ COSTS[cost].letter }}</abbr>
</template>

<script lang="ts" setup>
export type DsCost = 'action' | 'bonus' | 'reaction'

defineProps<{ cost: DsCost }>()

const COSTS: Record<DsCost, { letter: string, name: string, class: string }> = {
  action: { letter: 'A', name: 'Action', class: 'bg-ds-action' },
  bonus: { letter: 'B', name: 'Action bonus', class: 'bg-ds-bonus' },
  reaction: { letter: 'R', name: 'Réaction', class: 'bg-ds-reaction' },
}
</script>
