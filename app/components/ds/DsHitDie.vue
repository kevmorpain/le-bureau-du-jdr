<template>
  <button
    type="button"
    :disabled="spent"
    :aria-pressed="chosen"
    :aria-label="ariaLabel"
    class="group ds-cut-hex relative isolate flex h-[42px] w-[38px] shrink-0 cursor-pointer items-center justify-center p-[1.5px] disabled:cursor-not-allowed"
    :class="chosen ? 'bg-ds-gold' : spent ? 'bg-ds-line opacity-45' : 'bg-ds-gold-dim focus-visible:bg-ds-gold'"
  >
    <span
      class="ds-cut-hex flex size-full items-center justify-center font-bold"
      :class="chosen
        ? 'bg-ds-gold font-bodoni text-sm text-ds-bg'
        : spent
          ? 'bg-[repeating-linear-gradient(45deg,var(--color-ds-line)_0_2px,var(--color-ds-bg)_2px_6px)] text-[11px] text-ds-mute'
          : 'bg-ds-bg text-[11px] text-ds-mute'"
      aria-hidden="true"
    >{{ chosen && value !== null ? value : die }}</span>
  </button>
</template>

<script lang="ts" setup>
const props = withDefaults(defineProps<{
  die: string
  // Résultat du jet une fois le dé choisi ; null tant qu'il n'est pas lancé ni saisi.
  value?: number | null
  chosen?: boolean
  spent?: boolean
}>(), { value: null, chosen: false, spent: false })

const ariaLabel = computed(() => {
  if (props.spent) return `Dé de vie ${props.die} déjà dépensé`
  if (props.chosen) return props.value === null ? `Dé de vie ${props.die} choisi` : `Dé de vie ${props.die} choisi : ${props.value}`
  return `Dé de vie ${props.die} à dépenser`
})
</script>
