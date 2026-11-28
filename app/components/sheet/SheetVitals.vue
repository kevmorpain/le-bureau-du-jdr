<template>
  <button
    type="button"
    class="vitals"
    :aria-label="$t(isDying ? 'sheet.rail.open_death_saves' : 'sheet.rail.open_hit_points')"
    @click="openVitals"
  >
    <span class="vitals__row">
      <span class="ds-label">{{ $t('ds.hp.label') }}</span>
      <span class="vitals__value">
        <span class="ds-number vitals__current">{{ characterSheet.currentHp }}</span>
        <span class="vitals__max">/ {{ effectiveMaxHp }}</span>
        <span
          v-if="characterSheet.temporaryHp"
          class="vitals__temp"
        >{{ $t('sheet.rail.temp_hp', { n: characterSheet.temporaryHp }) }}</span>
      </span>
    </span>
    <DsHpBar
      :max="effectiveMaxHp"
      :current="characterSheet.currentHp"
      :temp="characterSheet.temporaryHp ?? 0"
    />
  </button>
</template>

<script lang="ts" setup>
import { useSheetWindows } from '~/composables/character/useSheetWindows'

const { characterSheet } = defineProps<{ characterSheet: CharacterSheet }>()
const characterSheetRef = toRef(() => characterSheet)

const { effectiveMaxHp, isDying } = useCharacterSheet(characterSheetRef)
const { openVitals } = useSheetWindows(characterSheetRef)
</script>

<style scoped>
.vitals {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.vitals:focus-visible { outline: 2px solid var(--color-ds-gold); }

.vitals__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.vitals__value {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.vitals__current { font-size: 18px; }

.vitals__max {
  font-size: 12px;
  color: var(--color-ds-mute);
}

.vitals__temp {
  font-size: 10.5px;
  font-weight: 700;
  color: var(--color-ds-mute);
}
</style>
