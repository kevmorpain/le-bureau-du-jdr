<template>
  <span
    class="diamond"
    :class="[`diamond--${size}`, `diamond--${tone}`, { 'diamond--filled': filled, 'diamond--possible': state === 'possible' }]"
    :data-state="state"
    aria-hidden="true"
  />
</template>

<script lang="ts" setup>
export type DsDiamondState = 'empty' | 'filled' | 'regained' | 'possible' | 'lost'
export type DsDiamondColor = 'gold' | 'gain' | 'bad'

const { state = 'empty', size = 'sm', color } = defineProps<{
  state?: DsDiamondState
  size?: 'sm' | 'lg'
  color?: DsDiamondColor
}>()

const tone = computed<DsDiamondColor>(() => color ?? (state === 'regained' ? 'gain' : state === 'lost' ? 'bad' : 'gold'))
const filled = computed(() => state === 'filled' || state === 'regained')
</script>

<style scoped>
.diamond {
  display: inline-block;
  flex-shrink: 0;
  box-sizing: border-box;
  transform: rotate(45deg);
  border: 1.5px solid var(--tone);
}

.diamond--sm { width: 12px; height: 12px; }
.diamond--lg { width: 20px; height: 20px; border-width: 2px; }

.diamond--gold { --tone: var(--color-ds-gold); }
.diamond--gain { --tone: var(--color-ds-gain); }
.diamond--bad { --tone: var(--color-ds-bad); }

.diamond--filled { background: var(--tone); }
.diamond--possible { border-style: dashed; }
</style>
