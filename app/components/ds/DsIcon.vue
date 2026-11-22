<template>
  <span
    v-if="name === 'favorite'"
    class="inline-flex items-center justify-center leading-none text-ds-gold"
    :style="{ fontSize: `${size}px`, width: `${size}px`, height: `${size}px` }"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
  >★</span>
  <svg
    v-else
    :viewBox="ICONS[name].viewBox ?? '0 0 16 16'"
    :width="size"
    :height="size"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
    class="shrink-0"
    v-bind="ICONS[name].attrs"
  >
    <circle
      v-for="(circle, index) in ICONS[name].circles ?? []"
      :key="`c${index}`"
      v-bind="circle"
    />
    <path
      v-for="(d, index) in ICONS[name].paths"
      :key="`p${index}`"
      :d="d"
    />
  </svg>
</template>

<script lang="ts" setup>
// L'étoile est réservée aux favoris, le rituel a sa bougie ; les icônes de navigation prennent la couleur du texte.
type SheetIcon = 'spell' | 'feature' | 'weapon' | 'item' | 'concentration' | 'ritual' | 'favorite'
type NavIcon = 'nav-play' | 'nav-character' | 'nav-inventory' | 'nav-grimoire' | 'nav-notes' | 'nav-settings' | 'nav-characters'
export type DsIconName = SheetIcon | NavIcon

withDefaults(defineProps<{ name: DsIconName, size?: number, label?: string }>(), { size: 16, label: undefined })

interface IconDef {
  viewBox?: string
  attrs: Record<string, string | number>
  paths: string[]
  circles?: Record<string, string | number>[]
}

const stroke = (color: string, width: number) =>
  ({ 'fill': 'none', 'stroke': color, 'stroke-width': width, 'stroke-linejoin': 'round' })

const nav = (paths: string[], circles?: IconDef['circles']): IconDef =>
  ({ viewBox: '0 0 24 24', attrs: stroke('currentColor', 1.6), paths, circles })

const ICONS: Record<Exclude<DsIconName, 'favorite'>, IconDef> = {
  'spell': { attrs: { fill: 'var(--color-ds-spell)' }, paths: ['M8 1l1.6 5.4L15 8l-5.4 1.6L8 15l-1.6-5.4L1 8l5.4-1.6z'] },
  'feature': { attrs: stroke('var(--color-ds-feature)', 1.6), paths: ['M8 1.5l5.6 3.2v6.6L8 14.5l-5.6-3.2V4.7z'] },
  'weapon': { attrs: stroke('var(--color-ds-weapon)', 1.6), paths: ['M3 13L13 3M10 3h3v3M3 10l3 3M2 14l2-2'] },
  'item': { attrs: stroke('var(--color-ds-item)', 1.6), paths: ['M6 2h4M6.5 2v4L3 13a1 1 0 0 0 .9 1.5h8.2A1 1 0 0 0 13 13L9.5 6V2'] },
  'concentration': {
    attrs: stroke('var(--color-ds-gold)', 1.4),
    paths: [],
    circles: [{ cx: 8, cy: 8, r: 6 }, { cx: 8, cy: 8, r: 2.2, fill: 'var(--color-ds-gold)' }],
  },
  'ritual': { attrs: stroke('var(--color-ds-gold)', 1.3), paths: ['M8 1.5c1.3 1.5 1.3 2.7 0 3.6-1.3-.9-1.3-2.1 0-3.6z', 'M5.6 6.6h4.8v7.4H5.6zM3.8 14.3h8.4'] },
  'nav-play': nav(['M12 3l2.4 5.6L20 9.2l-4.3 3.9 1.3 5.9L12 16l-5 3 1.3-5.9L4 9.2l5.6-.6z']),
  'nav-character': nav(['M4 21c1-4.5 4.2-7 8-7s7 2.5 8 7'], [{ cx: 12, cy: 8, r: 4 }]),
  'nav-inventory': nav(['M7 9a5 5 0 0 1 10 0v11H7z', 'M10 4.5V4a2 2 0 0 1 4 0v.5M7 14h10M10 14v2h4v-2']),
  'nav-grimoire': nav(['M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z', 'M5 17a3 3 0 0 1 3-3h11']),
  'nav-notes': nav(['M6 3h9l4 4v14H6z', 'M9 11h7M9 15h7']),
  'nav-settings': nav(
    ['M12 2.5l1.6 2.6 3-.6.6 3 2.6 1.6-1.3 2.9 1.3 2.9-2.6 1.6-.6 3-3-.6L12 21.5l-1.6-2.6-3 .6-.6-3-2.6-1.6 1.3-2.9-1.3-2.9 2.6-1.6.6-3 3 .6z'],
    [{ cx: 12, cy: 12, r: 3 }],
  ),
  'nav-characters': nav(
    ['M3 19c.7-3.4 3-5.3 6-5.3s5.3 1.9 6 5.3', 'M15.5 12.4c2.8-.3 4.9 1.4 5.5 4.6'],
    [{ cx: 9, cy: 8, r: 3.2 }, { cx: 16.5, cy: 7, r: 2.6 }],
  ),
}
</script>
