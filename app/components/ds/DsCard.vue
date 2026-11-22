<template>
  <component
    :is="as"
    :type="as === 'button' ? 'button' : undefined"
    :aria-pressed="as === 'button' ? selected : undefined"
    class="ds-cut-card block w-full p-px pt-0.5 text-left [--ds-cut:11px]"
    :class="selected ? 'bg-ds-gold' : 'bg-[linear-gradient(var(--color-ds-gold-dim)_0_2px,var(--color-ds-line)_2px)]'"
  >
    <div
      class="ds-cut-card flex h-full flex-col gap-1 px-[11px] pb-2.5 pt-2 [--ds-cut:10.6px]"
      :class="selected ? 'bg-ds-panel-raised' : 'bg-ds-panel'"
    >
      <slot />
    </div>
  </component>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{ selected?: boolean, as?: 'div' | 'button' | 'article' }>(), { selected: false, as: 'div' })
</script>
