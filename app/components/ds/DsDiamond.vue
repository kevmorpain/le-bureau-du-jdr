<template>
  <span
    class="box-border inline-block shrink-0 rotate-45"
    :class="[SIZE[size], TONE[tone], { 'border-dashed': state === 'maybe', [FILLED[tone]]: filled }]"
    :data-state="state"
    aria-hidden="true"
  />
</template>

<script lang="ts" setup>
// full : coché ; gain : rendu ou regagné ; maybe : possible selon le jet ; lost : perdu.
export type DsDiamondState = 'empty' | 'full' | 'gain' | 'maybe' | 'lost'
type Tone = 'gold' | 'gain' | 'bad'

const props = withDefaults(defineProps<{
  state?: DsDiamondState
  size?: 'sm' | 'lg'
  color?: Tone
}>(), { state: 'empty', size: 'sm', color: undefined })

const SIZE = { sm: 'size-3 border-[1.5px]', lg: 'size-5 border-2' }
const TONE: Record<Tone, string> = { gold: 'border-ds-gold', gain: 'border-ds-gain', bad: 'border-ds-bad' }
const FILLED: Record<Tone, string> = { gold: 'bg-ds-gold', gain: 'bg-ds-gain', bad: 'bg-ds-bad' }

const tone = computed<Tone>(() => props.color ?? (props.state === 'gain' ? 'gain' : props.state === 'lost' ? 'bad' : 'gold'))
const filled = computed(() => props.state === 'full' || props.state === 'gain')
</script>
