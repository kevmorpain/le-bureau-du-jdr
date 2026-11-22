<template>
  <span
    class="ds-cut-corner inline-flex whitespace-nowrap font-bold uppercase [--ds-cut:4px]"
    :class="[STYLE[variant].edge, STYLE[variant].outer]"
    :data-variant="variant"
  >
    <span
      class="ds-cut-corner inline-flex h-full items-center [--ds-cut:3.6px]"
      :class="[STYLE[variant].text, STYLE[variant].inner, STYLE[variant].outlined ? FILL[surface] : '']"
    >
      <slot>{{ label }}</slot>
    </span>
  </span>
</template>

<script lang="ts" setup>
// badge : rareté, niveau, lien ; equipped, attuned, bag : état d'un objet ; new : ce qui n'existe pas encore dans l'appli.
export type DsBadgeVariant = 'badge' | 'equipped' | 'attuned' | 'bag' | 'new'
type Surface = 'panel' | 'panel-raised' | 'bg'

// Un badge à bord seul se fait en deux couches : son fond doit être celui de la surface où il est posé.
withDefaults(defineProps<{ label?: string, variant?: DsBadgeVariant, surface?: Surface }>(), {
  label: undefined,
  variant: 'badge',
  surface: 'panel',
})

// La hauteur se fixe sur la couche extérieure : sans elle, une rangée en flex l'étirerait sous la couche de fond.
const OUTLINED = { outer: 'h-[18px] p-px', inner: 'px-1.5 text-[10px] tracking-[0.06em]', outlined: true }
const FILLED = { outer: 'h-[18px]', inner: 'px-[7px] text-[10px] tracking-[0.06em]', outlined: false }

const STYLE: Record<DsBadgeVariant, { edge: string, text: string, outer: string, inner: string, outlined: boolean }> = {
  badge: { edge: 'bg-ds-gold-dim', text: 'text-ds-gold', ...OUTLINED },
  equipped: { edge: 'bg-ds-gold', text: 'text-ds-bg', ...FILLED },
  attuned: { edge: 'bg-ds-gain', text: 'text-ds-bg', ...FILLED },
  bag: { edge: 'bg-ds-line', text: 'text-ds-mute', ...OUTLINED },
  new: { edge: 'bg-ds-gain', text: 'text-ds-gain', outer: 'h-4 p-px', inner: 'px-[5px] text-[9.5px] tracking-[0.08em]', outlined: true },
}

const FILL: Record<Surface, string> = {
  'panel': 'bg-ds-panel',
  'panel-raised': 'bg-ds-panel-raised',
  'bg': 'bg-ds-bg',
}
</script>
