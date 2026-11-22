<template>
  <button
    type="button"
    class="save"
    :class="`save--${state}`"
    :aria-label="ariaLabel"
    :data-state="state"
  >
    <span
      class="save__mark"
      aria-hidden="true"
    />
    <span
      class="save__label"
      aria-hidden="true"
    >{{ state === 'pending' ? pending : $t(`ds.save.states.${state}`) }}</span>
    <span
      v-if="pendingLine"
      class="save__pending"
      aria-hidden="true"
    >{{ pendingLine }}</span>
  </button>
</template>

<script lang="ts" setup>
export type DsSaveState = 'saved' | 'saving' | 'pending' | 'offline' | 'failed' | 'conflict'

const { state, pending = 0 } = defineProps<{ state: DsSaveState, pending?: number }>()

const { t } = useI18n()

const pendingLine = computed(() => {
  if (state === 'pending') return t('ds.save.pending_line')
  if (state === 'offline' && pending > 0) return t('ds.save.pending_count', { n: pending })
  return null
})

const ariaLabel = computed(() => {
  if (state === 'pending') return t('ds.save.aria', { state: t('ds.save.pending_count', { n: pending }) })
  const label = t(`ds.save.states.${state}`).toLowerCase()
  const withPending = pending > 0 && state !== 'saved' ? t('ds.save.aria_pending', { state: label, n: pending }) : label
  return t('ds.save.aria', { state: withPending })
})
</script>

<style scoped>
.save {
  --mark: transparent;
  --mark-ring: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  width: 64px;
  padding: 6px 0 4px;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.15;
  text-align: center;
  color: var(--color-ds-faint);
  cursor: pointer;
}

.save:focus-visible { outline: 2px solid var(--color-ds-gold); }

.save__mark {
  width: 9px;
  height: 9px;
  margin-bottom: 2px;
  transform: rotate(45deg);
  background: var(--mark);
  box-shadow: inset 0 0 0 1.5px var(--mark-ring);
}

.save__pending {
  font-weight: 400;
  color: var(--color-ds-mute);
}

.save--saved { --mark: var(--color-ds-gain); }

.save--saving {
  --mark-ring: var(--color-ds-gold);
  color: var(--color-ds-gold);
}

.save--pending {
  --mark: var(--color-ds-gold);
  color: var(--color-ds-gold);
}

.save--pending .save__label { font-size: 13px; }

.save--offline {
  --mark-ring: var(--color-ds-mute);
  color: var(--color-ds-mute);
}

.save--failed,
.save--conflict {
  --mark: var(--color-ds-bad);
  color: var(--color-ds-bad);
}

@media (prefers-reduced-motion: no-preference) {
  .save--saving .save__mark { animation: ds-save-pulse 1.1s ease-in-out infinite; }
}
</style>
