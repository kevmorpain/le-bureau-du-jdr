<template>
  <button
    type="button"
    :aria-label="label"
    :aria-pressed="toggle ? active : undefined"
    class="group ds-cut-corner inline-flex size-[30px] shrink-0 cursor-pointer bg-ds-gold-dim p-px [--ds-cut:7px] focus-visible:bg-ds-gold"
  >
    <span
      class="ds-cut-corner flex size-full items-center justify-center bg-ds-panel-raised text-sm [--ds-cut:6.6px]"
      :class="active ? 'text-ds-gold' : 'text-ds-mute group-hover:text-ds-ink'"
      aria-hidden="true"
    >
      <slot>{{ ICONS[icon] }}</slot>
    </span>
  </button>
</template>

<script lang="ts" setup>
export type DsCornerIcon = 'close' | 'favorite'

withDefaults(defineProps<{
  label: string
  icon?: DsCornerIcon
  active?: boolean
  toggle?: boolean
}>(), { icon: 'close', active: false, toggle: false })

const ICONS: Record<DsCornerIcon, string> = {
  close: '✕',
  favorite: '★',
}
</script>
