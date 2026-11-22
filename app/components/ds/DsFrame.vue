<template>
  <component
    :is="as"
    class="ds-bevel frame"
    :class="[`ds-shape-${shape}`, `frame--edge-${tone}`, `frame--fill-${fill}`]"
  >
    <div
      class="ds-fill frame__fill"
      :class="{ 'frame__fill--padded': padded }"
    >
      <slot />
    </div>
  </component>
</template>

<script lang="ts" setup>
export type DsFrameShape = 'octagon' | 'stepped' | 'corner'
export type DsFrameTone = 'gold' | 'gold-dim' | 'line' | 'bad'
export type DsFrameFill = 'panel' | 'panel-raised' | 'bg'

const {
  shape = 'octagon',
  tone = 'gold',
  fill = 'panel',
  padded = true,
  as = 'div',
} = defineProps<{
  shape?: DsFrameShape
  tone?: DsFrameTone
  fill?: DsFrameFill
  padded?: boolean
  as?: string
}>()
</script>

<style scoped>
.frame.ds-shape-octagon { --ds-cut: var(--ds-cut-panel); }
.frame.ds-shape-stepped { --ds-cut: var(--ds-cut-step); --ds-edge: 1.5px; }
.frame.ds-shape-corner { --ds-cut: var(--ds-cut-control); }

.frame--edge-gold { --ds-edge-color: var(--color-ds-gold); }
.frame--edge-gold-dim { --ds-edge-color: var(--color-ds-gold-dim); }
.frame--edge-line { --ds-edge-color: var(--color-ds-line); }
.frame--edge-bad { --ds-edge-color: var(--color-ds-bad); }

.frame--fill-panel { --ds-fill: var(--color-ds-panel); }
.frame--fill-panel-raised { --ds-fill: var(--color-ds-panel-raised); }
.frame--fill-bg { --ds-fill: var(--color-ds-bg); }

.frame__fill { height: 100%; }
.frame__fill--padded { padding: 10px 14px; }
</style>
