<template>
  <button
    :type="type"
    :disabled="disabled"
    class="group ds-cut-point cursor-pointer p-0.5 [--ds-cut:12px] disabled:cursor-not-allowed disabled:opacity-50"
    :class="[EDGE[variant], block ? 'flex w-full' : 'inline-flex']"
  >
    <span class="ds-cut-point flex flex-1 items-center justify-center gap-2.5 bg-ds-panel-raised px-6 py-2 [--ds-cut:11px] group-focus-visible:bg-[color-mix(in_srgb,var(--color-ds-gold)_22%,var(--color-ds-panel-raised))] group-enabled:group-active:bg-[color-mix(in_srgb,var(--color-ds-gold)_14%,var(--color-ds-panel-raised))]">
      <b
        class="whitespace-nowrap text-[13.5px] font-bold uppercase tracking-[0.14em]"
        :class="LABEL[variant]"
      ><slot>{{ label }}</slot></b>
      <small
        v-if="detail"
        class="whitespace-nowrap text-[11px] text-ds-mute"
      >{{ detail }}</small>
    </span>
  </button>
</template>

<script lang="ts" setup>
export type DsButtonVariant = 'primary' | 'secondary' | 'danger'

withDefaults(defineProps<{
  label?: string
  detail?: string
  variant?: DsButtonVariant
  type?: 'button' | 'submit'
  disabled?: boolean
  block?: boolean
}>(), {
  label: undefined,
  detail: undefined,
  variant: 'primary',
  type: 'button',
  disabled: false,
  block: false,
})

const EDGE: Record<DsButtonVariant, string> = {
  primary: 'bg-ds-gold',
  secondary: 'bg-ds-gold-dim',
  danger: 'bg-ds-bad',
}

const LABEL: Record<DsButtonVariant, string> = {
  primary: 'text-ds-gold',
  secondary: 'text-ds-ink',
  danger: 'text-ds-bad',
}
</script>
