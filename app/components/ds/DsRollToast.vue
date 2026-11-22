<template>
  <DsFrame
    shape="corner"
    :tone="roll.isCrit ? 'gold' : roll.isFumble ? 'bad' : 'line'"
    fill="panel-raised"
    class="w-72 font-atkinson"
    role="status"
  >
    <p class="text-xs text-ds-mute">
      {{ roll.label }}
    </p>
    <div class="flex flex-wrap items-baseline gap-x-2">
      <span
        class="font-bodoni text-3xl font-bold leading-none"
        :class="roll.isCrit ? 'text-ds-gold' : roll.isFumble ? 'text-ds-bad' : 'text-ds-ink'"
      >{{ roll.result }}</span>
      <span class="text-xs text-ds-mute">{{ rollDiceText(roll) }}</span>
      <span
        v-if="roll.isCrit || roll.isFumble"
        class="ds-label"
        :class="roll.isCrit ? 'text-ds-gold' : 'text-ds-bad'"
      >{{ roll.isCrit ? 'Critique' : 'Échec critique' }}</span>
    </div>
    <p
      v-for="note in rollNotes(roll)"
      :key="note"
      class="mt-1 text-xs"
      :class="roll.autoFail?.length ? 'text-ds-bad' : 'text-ds-mute'"
    >
      {{ note }}
    </p>
  </DsFrame>
</template>

<script lang="ts" setup>
import type { DiceRoll } from '~/composables/useDiceRoller'

defineProps<{ roll: DiceRoll }>()
</script>
