<template>
  <button
    type="button"
    :disabled="spent"
    :aria-pressed="chosen"
    :aria-label="ariaLabel"
    class="ds-bevel ds-shape-hex die"
    :class="{ 'die--chosen': chosen, 'die--spent': spent }"
  >
    <span
      class="ds-fill die__fill"
      aria-hidden="true"
    >{{ chosen && value !== null ? value : die }}</span>
  </button>
</template>

<script lang="ts" setup>
const { die, value = null, chosen = false, spent = false } = defineProps<{
  die: string
  value?: number | null
  chosen?: boolean
  spent?: boolean
}>()

const { t } = useI18n()

const ariaLabel = computed(() => {
  if (spent) return t('ds.hit_die.spent', { die })
  if (chosen) return value === null ? t('ds.hit_die.chosen', { die }) : t('ds.hit_die.rolled', { die, value })
  return t('ds.hit_die.available', { die })
})
</script>

<style scoped>
.die {
  --ds-edge: 1.5px;
  --ds-edge-color: var(--color-ds-gold-dim);
  --ds-fill: var(--color-ds-bg);
  display: flex;
  flex-shrink: 0;
  width: 38px;
  height: 42px;
  cursor: pointer;
}

.die:focus-visible { outline: none; --ds-edge-color: var(--color-ds-gold); }

.die--chosen {
  --ds-edge-color: var(--color-ds-gold);
  --ds-fill: var(--color-ds-gold);
}

.die--spent {
  --ds-edge-color: var(--color-ds-line);
  --ds-fill: repeating-linear-gradient(45deg, var(--color-ds-line) 0 2px, var(--color-ds-bg) 2px 6px);
  opacity: 0.45;
  cursor: not-allowed;
}

.die__fill {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-ds-mute);
}

.die--chosen .die__fill {
  font-family: var(--font-bodoni);
  font-size: 14px;
  color: var(--color-ds-bg);
}
</style>
