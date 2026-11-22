<template>
  <component
    :is="as"
    :class="[CUT[shape], EDGE[tone]]"
    :style="{ '--ds-cut': `${size.cut}px`, 'padding': `${size.edge}px` }"
  >
    <div
      class="h-full"
      :class="[CUT[shape], FILL[fill], { 'px-3.5 py-2.5': padded }]"
      :style="{ '--ds-cut': `${innerCut}px` }"
    >
      <slot />
    </div>
  </component>
</template>

<script lang="ts" setup>
export type DsFrameShape = 'octagon' | 'stepped' | 'corner'
export type DsFrameTone = 'gold' | 'gold-dim' | 'line' | 'bad'
export type DsFrameFill = 'panel' | 'panel-raised' | 'bg'

const props = withDefaults(defineProps<{
  shape?: DsFrameShape
  tone?: DsFrameTone
  fill?: DsFrameFill
  cut?: number
  padded?: boolean
  as?: string
}>(), {
  shape: 'octagon',
  tone: 'gold',
  fill: 'panel',
  cut: undefined,
  padded: true,
  as: 'div',
})

const CUT: Record<DsFrameShape, string> = {
  octagon: 'ds-cut-octagon',
  stepped: 'ds-cut-stepped',
  corner: 'ds-cut-corner',
}

const EDGE: Record<DsFrameTone, string> = {
  'gold': 'bg-ds-gold',
  'gold-dim': 'bg-ds-gold-dim',
  'line': 'bg-ds-line',
  'bad': 'bg-ds-bad',
}

const FILL: Record<DsFrameFill, string> = {
  'panel': 'bg-ds-panel',
  'panel-raised': 'bg-ds-panel-raised',
  'bg': 'bg-ds-bg',
}

const SIZES: Record<DsFrameShape, { cut: number, edge: number }> = {
  octagon: { cut: 10, edge: 1 },
  stepped: { cut: 8, edge: 1.5 },
  corner: { cut: 7, edge: 1 },
}

const size = computed(() => ({ ...SIZES[props.shape], ...(props.cut ? { cut: props.cut } : {}) }))

// Un biseau à 45° rentre de (√2 − 1) fois l'épaisseur du bord pour garder un trait régulier ; un gradin, droit, ne rentre pas.
const innerCut = computed(() =>
  props.shape === 'stepped' ? size.value.cut : size.value.cut - size.value.edge * (Math.SQRT2 - 1))
</script>
