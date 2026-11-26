<template>
  <section
    class="combat"
    :aria-label="$t('sheet.combat.bar')"
  >
    <div class="ds-bevel ds-shape-card combat__frame">
      <div class="ds-fill combat__bar">
        <span class="combat__title">{{ $t('sheet.combat.bar') }}</span>

        <span
          class="combat__group"
          role="group"
          :aria-label="$t('sheet.combat.round')"
        >
          <span class="ds-label">{{ $t('sheet.combat.round') }}</span>
          <DsCornerButton
            :label="$t('sheet.combat.previous_round')"
            @click="previousRound"
          >−</DsCornerButton>
          <span class="ds-number combat__value">{{ round }}</span>
          <DsCornerButton
            :label="$t('sheet.combat.next_round')"
            @click="advanceRound"
          >+</DsCornerButton>
        </span>

        <span
          class="combat__group"
          role="group"
          :aria-label="$t('sheet.combat.initiative')"
        >
          <span class="ds-label">{{ $t('sheet.combat.initiative') }}</span>
          <span class="ds-number combat__value">{{ initiative?.total ?? '—' }}</span>
        </span>

        <span class="combat__group combat__movement">
          <span class="ds-label">{{ $t('sheet.combat.movement') }}</span>
          <span
            class="combat__track"
            role="meter"
            :aria-label="$t('sheet.combat.movement')"
            :aria-valuenow="movementUsed"
            :aria-valuemin="0"
            :aria-valuemax="effectiveSpeed"
          >
            <i :style="{ width: `${movementPercent}%` }" />
          </span>
          <span class="combat__distance">{{ $t('sheet.combat.movement_value', { used: formatNumber(movementUsed), speed: formatNumber(effectiveSpeed) }) }}</span>
          <DsCornerButton
            :label="$t('sheet.combat.move_less')"
            @click="moveBy(-1, effectiveSpeed)"
          >−</DsCornerButton>
          <DsCornerButton
            :label="$t('sheet.combat.move_more')"
            @click="moveBy(1, effectiveSpeed)"
          >+</DsCornerButton>
        </span>

        <DsButton
          :label="$t('sheet.combat.new_turn')"
          @click="handleNewTurn"
        />
      </div>
    </div>

    <p
      v-if="note"
      class="combat__note"
      role="status"
    >
      <i aria-hidden="true" />{{ note }}
    </p>

    <div
      v-if="lapseQuestion.length"
      class="combat__lapse"
      role="alert"
    >
      <i aria-hidden="true" />
      <strong>{{ $t('sheet.combat.lapse_question', { name: lapsingNames }) }}</strong>
      <span class="combat__lapse-hint">{{ $t('sheet.combat.lapse_hint') }}</span>
      <DsLinkButton
        :label="$t('sheet.combat.lapse_keep')"
        @click="handleKeep"
      />
      <DsLinkButton
        :label="$t('sheet.combat.lapse_end')"
        @click="handleEnd"
      />
    </div>
  </section>
</template>

<script lang="ts" setup>
import { useCombatTurn } from '~/composables/character/useCombatTurn'

const { characterSheet } = defineProps<{ characterSheet: CharacterSheet }>()
const characterSheetRef = toRef(() => characterSheet)

const { t } = useI18n()
const { effectiveSpeed } = useCharacterSheet(characterSheetRef)
const {
  round, initiative, movementUsed, previousRound, advanceRound, moveBy, newTurn, lapseQuestion, keepLapsed, endLapsed,
} = useCombatTurn(characterSheetRef)

const note = ref('')

const movementPercent = computed(() =>
  effectiveSpeed.value > 0 ? Math.min(100, (movementUsed.value / effectiveSpeed.value) * 100) : 0)

const formatNumber = (n: number) => new Intl.NumberFormat('fr-FR').format(n)

const lapsingNames = computed(() => lapseQuestion.value.map(f => f.name).join(', '))

const handleNewTurn = () => {
  newTurn()
  note.value = t('sheet.combat.turn_note', { round: round.value })
}

const handleKeep = () => {
  note.value = t('sheet.combat.lapse_kept', { name: lapsingNames.value })
  keepLapsed()
}

const handleEnd = async () => {
  note.value = t('sheet.combat.lapse_ended', { name: lapsingNames.value })
  await endLapsed()
}
</script>

<style scoped>
.combat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.combat__frame {
  --ds-cut: var(--ds-cut-step);
  --ds-edge-color: var(--color-ds-gold-dim);
  --ds-fill: color-mix(in srgb, var(--color-ds-gold) 8%, var(--color-ds-panel));
}

.combat__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 18px;
  padding: 8px 10px 8px 14px;
}

.combat__title {
  font-family: var(--font-bodoni);
  font-size: 17px;
  color: var(--color-ds-gold);
}

.combat__group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.combat__value { font-size: 20px; }

.combat__movement {
  flex: 1;
  min-width: 260px;
}

.combat__track {
  position: relative;
  flex: 1;
  height: 8px;
  overflow: hidden;
  background: var(--color-ds-panel-raised);
  box-shadow: inset 0 0 0 1px var(--color-ds-line);
}

.combat__track i {
  position: absolute;
  inset: 0 auto 0 0;
  background: var(--color-ds-gain);
}

.combat__distance {
  font-size: 12px;
  white-space: nowrap;
  color: var(--color-ds-mute);
}

.combat__note,
.combat__lapse {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 2px 4px;
  font-size: 12px;
}

.combat__note { color: var(--color-ds-mute); }

.combat__note i,
.combat__lapse > i {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  transform: rotate(45deg);
  background: var(--color-ds-gain);
}

.combat__lapse > i { background: var(--color-ds-feature); }

.combat__lapse strong { font-size: 12.5px; }

.combat__lapse-hint {
  flex: 1;
  color: var(--color-ds-mute);
}
</style>
