<template>
  <DsFrame
    shape="corner"
    :tone="roll.isCrit ? 'gold' : roll.isFumble ? 'bad' : 'line'"
    fill="panel-raised"
    class="toast"
    :class="{ 'toast--crit': roll.isCrit, 'toast--fumble': roll.isFumble }"
    role="status"
  >
    <p class="toast__label">
      {{ roll.label }}
    </p>
    <div class="toast__line">
      <span class="ds-number toast__result">{{ roll.result }}</span>
      <span class="toast__dice">{{ rollDiceText(roll) }}</span>
      <span
        v-if="roll.isCrit || roll.isFumble"
        class="ds-label toast__outcome"
      >{{ $t(roll.isCrit ? 'ds.roll.crit' : 'ds.roll.fumble') }}</span>
    </div>
    <p
      v-for="note in rollNotes(roll)"
      :key="note"
      class="toast__note"
      :class="{ 'toast__note--fail': roll.autoFail?.length }"
    >
      {{ note }}
    </p>
  </DsFrame>
</template>

<script lang="ts" setup>
import type { DiceRoll } from '~/composables/useDiceRoller'

const { roll } = defineProps<{ roll: DiceRoll }>()
</script>

<style scoped>
.toast {
  --outcome: var(--color-ds-ink);
  width: 288px;
  font-family: var(--font-atkinson);
}

.toast--crit { --outcome: var(--color-ds-gold); }
.toast--fumble { --outcome: var(--color-ds-bad); }

.toast__label,
.toast__dice,
.toast__note {
  font-size: 12px;
  color: var(--color-ds-mute);
}

.toast__line {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 8px;
}

.toast__result {
  font-size: 30px;
  line-height: 1;
  color: var(--outcome);
}

.toast__outcome { color: var(--outcome); }
.toast__note { margin-top: 4px; }
.toast__note--fail { color: var(--color-ds-bad); }
</style>
