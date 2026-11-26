<template>
  <section
    class="combat"
    :aria-label="$t('sheet.combat.bar')"
  >
    <div class="ds-bevel ds-shape-card combat__frame">
      <div class="ds-fill combat__inner">
        <div class="combat__bar">
          <div class="combat__stats">
            <div class="combat__row">
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
                  @click="handleNextRound"
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
            </div>

            <div class="combat__row">
              <span
                class="combat__group"
                role="group"
                :aria-label="$t('sheet.combat.turn')"
              >
                <span class="ds-label">{{ $t('sheet.combat.turn') }}</span>
                <button
                  v-for="action in turnActions"
                  :key="action.key"
                  type="button"
                  class="combat__action"
                  :class="{ 'combat__action--spent': action.isSpent }"
                  :aria-pressed="action.isSpent"
                  :aria-label="$t(action.isSpent ? 'sheet.combat.action_spent' : 'sheet.combat.action_available', { action: action.label })"
                  :title="action.label"
                  @click="toggleAction(action.key)"
                >
                  <DsCostTag :cost="action.cost" />
                  <DsDiamond
                    :state="action.isSpent ? 'empty' : 'filled'"
                    :color="action.cost"
                  />
                </button>
              </span>

              <span class="combat__group">
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
                <span class="combat__distance">
                  <span>{{ $t('sheet.combat.movement_value', { used: formatNumber(movementUsed), speed: formatNumber(effectiveSpeed) }) }}</span>
                  <span
                    class="combat__distance-sizer"
                    aria-hidden="true"
                  >{{ $t('sheet.combat.movement_value', { used: formatNumber(widestMovement), speed: formatNumber(effectiveSpeed) }) }}</span>
                </span>
                <DsCornerButton
                  :label="$t('sheet.combat.move_less')"
                  @click="moveBy(-1, effectiveSpeed)"
                >−</DsCornerButton>
                <DsCornerButton
                  :label="$t('sheet.combat.move_more')"
                  @click="moveBy(1, effectiveSpeed)"
                >+</DsCornerButton>
              </span>
            </div>
          </div>

          <DsButton
            :label="$t('sheet.combat.new_turn')"
            @click="handleNewTurn"
          />
        </div>

        <p
          v-if="note.length"
          class="combat__note"
          role="status"
        >
          <i aria-hidden="true" />{{ note.join(', ') }}
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
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { useCombatTurn } from '~/composables/character/useCombatTurn'
import { TURN_ACTIONS, type TurnAction } from '~/composables/character/useCombatTracker'
import type { DsCost } from '~/components/ds/DsCostTag.vue'
import type { ElapsedDuration } from '~~/shared/rules/durations'

const COSTS: Record<TurnAction, DsCost> = { action: 'action', bonus_action: 'bonus', reaction: 'reaction' }

const { characterSheet } = defineProps<{ characterSheet: CharacterSheet }>()
const characterSheetRef = toRef(() => characterSheet)

const { t } = useI18n()
const { effectiveSpeed } = useCharacterSheet(characterSheetRef)
const {
  round, initiative, movementUsed, usedActions, previousRound, advanceRound, moveBy, toggleAction, newTurn,
  lapseQuestion, keepLapsed, endLapsed,
} = useCombatTurn(characterSheetRef)

const note = ref<string[]>([])

const movementPercent = computed(() =>
  effectiveSpeed.value > 0 ? Math.min(100, (movementUsed.value / effectiveSpeed.value) * 100) : 0)

const formatNumber = (n: number) => new Intl.NumberFormat('fr-FR').format(n)

// Reserves the width of the longest value (a decimal just under the Dash cap) so the buttons beside it stay put.
const widestMovement = computed(() => Math.max(0, effectiveSpeed.value * 2 - 0.5))

const turnActions = computed(() => TURN_ACTIONS.map(key => ({
  key,
  cost: COSTS[key],
  label: t(`ds.cost.${COSTS[key]}.name`),
  isSpent: usedActions.value[key],
})))

const lapsingNames = computed(() => lapseQuestion.value.map(f => f.name).join(', '))

const describeDurations = (elapsed: ElapsedDuration[]) => elapsed
  .map(d => (d.to > 0 ? t('sheet.combat.duration_tick', d) : t('sheet.combat.duration_end', { name: d.name })))

const handleNewTurn = () => {
  note.value = describeDurations(newTurn({ announce: false }))
}

const handleNextRound = () => {
  note.value = describeDurations(advanceRound({ announce: false }))
}

const handleKeep = () => {
  note.value = [...note.value, t('sheet.combat.lapse_kept', { name: lapsingNames.value })]
  keepLapsed()
}

const handleEnd = async () => {
  note.value = [...note.value, t('sheet.combat.lapse_ended', { name: lapsingNames.value })]
  await endLapsed()
}
</script>

<style scoped>
.combat__frame {
  --ds-cut: var(--ds-cut-step);
  --ds-edge-color: var(--color-ds-gold-dim);
  --ds-fill: color-mix(in srgb, var(--color-ds-gold) 8%, var(--color-ds-panel));
}

.combat__inner {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px 8px 14px;
}

.combat__bar {
  display: flex;
  align-items: center;
  gap: 18px;
}

.combat__stats {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
}

.combat__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 18px;
}

.combat__action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px;
  cursor: pointer;
}

.combat__action:focus-visible { outline: 2px solid var(--color-ds-gold); }
.combat__action--spent { opacity: 0.45; }

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

.combat__track {
  position: relative;
  width: 110px;
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

@media (prefers-reduced-motion: no-preference) {
  .combat__track i { transition: width 0.3s ease; }
}

.combat__distance {
  display: inline-grid;
  justify-items: end;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--color-ds-mute);
}

.combat__distance > * { grid-area: 1 / 1; }

.combat__distance-sizer { visibility: hidden; }

.combat__note,
.combat__lapse {
  display: flex;
  align-items: center;
  gap: 9px;
  padding-top: 6px;
  font-size: 12px;
  border-top: 1px solid var(--color-ds-line);
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
