<template>
  <DsBlock :ribbon="$t('sheet.rail.turn')">
    <ul class="turn">
      <li
        v-for="row in rows"
        :key="row.action"
      >
        <button
          type="button"
          class="turn__row"
          :class="{ 'turn__row--spent': row.isSpent }"
          :aria-pressed="row.isSpent"
          :aria-label="$t(row.isSpent ? 'sheet.rail.turn_action_spent' : 'sheet.rail.turn_action_available', { action: row.label })"
          @click="toggleAction(row.action)"
        >
          <DsCostTag :cost="row.cost" />
          <span class="turn__name">{{ row.label }}</span>
          <DsDiamond
            :state="row.isSpent ? 'empty' : 'filled'"
            :color="row.cost"
          />
        </button>
      </li>
    </ul>
  </DsBlock>
</template>

<script lang="ts" setup>
import { TURN_ACTIONS, useCombatTracker, type TurnAction } from '~/composables/character/useCombatTracker'
import type { DsCost } from '~/components/ds/DsCostTag.vue'

const { characterId } = defineProps<{ characterId: number }>()

const { t } = useI18n()
const { usedActions, toggleAction } = useCombatTracker(characterId)

const COSTS: Record<TurnAction, DsCost> = { action: 'action', bonus_action: 'bonus', reaction: 'reaction' }

const rows = computed(() => TURN_ACTIONS.map(action => ({
  action,
  cost: COSTS[action],
  label: t(`ds.cost.${COSTS[action]}.name`),
  isSpent: usedActions.value[action],
})))
</script>

<style scoped>
.turn {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.turn__row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  font-size: 12.5px;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}

.turn__row:focus-visible { outline: 2px solid var(--color-ds-gold); }
.turn__row--spent { opacity: 0.45; }

.turn__name { flex: 1; }

.turn__row :deep(.diamond) { margin-right: 4px; }
</style>
