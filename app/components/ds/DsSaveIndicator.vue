<template>
  <button
    type="button"
    class="box-border flex w-16 cursor-pointer flex-col items-center gap-[3px] pb-1 pt-1.5 text-center text-[10px] font-bold leading-[1.15] focus-visible:outline-2 focus-visible:outline-ds-gold"
    :class="STATES[state].text"
    :aria-label="ariaLabel"
    :data-state="state"
  >
    <span
      class="mb-0.5 size-[9px] rotate-45"
      :class="STATES[state].mark"
      aria-hidden="true"
    />
    <span
      aria-hidden="true"
      :class="{ 'text-[13px]': state === 'pending' }"
    >{{ state === 'pending' ? pending : STATES[state].label }}</span>
    <span
      v-if="pendingLine"
      class="font-normal text-ds-mute"
      aria-hidden="true"
    >{{ pendingLine }}</span>
  </button>
</template>

<script lang="ts" setup>
// Seul endroit où voir l'état de la sauvegarde ; au toucher, la page ouvre le détail et l'action utile.
export type DsSaveState = 'saved' | 'saving' | 'pending' | 'offline' | 'failed' | 'conflict'

const props = withDefaults(defineProps<{ state: DsSaveState, pending?: number }>(), { pending: 0 })

const STATES: Record<DsSaveState, { label: string, text: string, mark: string }> = {
  saved: { label: 'Enregistré', text: 'text-ds-faint', mark: 'bg-ds-gain' },
  saving: { label: 'En cours', text: 'text-ds-gold', mark: 'shadow-[inset_0_0_0_1.5px_var(--color-ds-gold)] motion-safe:animate-[ds-save-pulse_1.1s_ease-in-out_infinite]' },
  pending: { label: 'En attente', text: 'text-ds-gold', mark: 'bg-ds-gold' },
  offline: { label: 'Hors ligne', text: 'text-ds-mute', mark: 'shadow-[inset_0_0_0_1.5px_var(--color-ds-mute)]' },
  failed: { label: 'Échec', text: 'text-ds-bad', mark: 'bg-ds-bad' },
  conflict: { label: 'Conflit', text: 'text-ds-bad', mark: 'bg-ds-bad' },
}

const pendingLine = computed(() =>
  props.state === 'pending' ? 'en attente' : props.state === 'offline' && props.pending > 0 ? `${props.pending} en attente` : null)

const ariaLabel = computed(() => {
  if (props.state === 'pending') return `Sauvegarde : ${props.pending} en attente`
  const base = `Sauvegarde : ${STATES[props.state].label.toLowerCase()}`
  return props.pending > 0 && props.state !== 'saved' ? `${base}, ${props.pending} en attente` : base
})
</script>
