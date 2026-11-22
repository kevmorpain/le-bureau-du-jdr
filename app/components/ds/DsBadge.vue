<template>
  <span
    class="ds-cut-corner inline-flex items-center whitespace-nowrap font-bold uppercase [--ds-cut:4px]"
    :class="VARIANT[variant]"
  >
    <slot>{{ label }}</slot>
  </span>
</template>

<script lang="ts" setup>
// badge : rareté, niveau, lien ; equipped, attuned, bag : état d'un objet ; new : ce qui n'existe pas encore dans l'appli.
export type DsBadgeVariant = 'badge' | 'equipped' | 'attuned' | 'bag' | 'new'

withDefaults(defineProps<{ label?: string, variant?: DsBadgeVariant }>(), { label: undefined, variant: 'badge' })

const STATE = 'h-[18px] px-[7px] text-[10px] tracking-[0.06em]'

const VARIANT: Record<DsBadgeVariant, string> = {
  badge: `${STATE} text-ds-gold shadow-[inset_0_0_0_1px_var(--color-ds-gold-dim)]`,
  equipped: `${STATE} bg-ds-gold text-ds-bg`,
  attuned: `${STATE} bg-ds-gain text-ds-bg`,
  bag: `${STATE} text-ds-mute shadow-[inset_0_0_0_1px_var(--color-ds-line)]`,
  new: 'h-4 px-1.5 text-[9.5px] tracking-[0.08em] text-ds-gain shadow-[inset_0_0_0_1px_var(--color-ds-gain)]',
}
</script>
