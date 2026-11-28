<template>
  <div
    class="toasts"
    aria-live="polite"
  >
    <DsRollToast
      v-for="toast in toasts"
      :key="toast.id"
      :roll="toast"
    />
  </div>

  <UPopover
    v-if="rollsEnabled"
    v-model:open="isOpen"
    :content="{ side: 'top', align: 'end', sideOffset: 8 }"
    :ui="{ content: 'bg-transparent ring-0 shadow-none rounded-none' }"
  >
    <DsButton
      class="trigger"
      :variant="hasPending ? 'secondary' : 'primary'"
      :label="pendingLabel ?? $t('rolls.button')"
      :aria-label="$t('rolls.button_aria')"
    />

    <template #content>
      <DsFrame
        shape="octagon"
        class="panel"
      >
        <div class="panel__body">
          <DsRibbon :label="$t('rolls.next')" />
          <DsSegmented
            v-model="pending.override"
            :options="modeOptions"
            :label="$t('rolls.next')"
          />
          <template v-if="situations.length">
            <p class="hint">
              {{ $t('rolls.situations') }}
            </p>
            <DsChips
              v-model="pending.situations"
              :options="situationOptions"
              :label="$t('rolls.situations')"
            />
          </template>
          <DsCheckbox
            v-model="pending.crit"
            :label="$t('rolls.crit')"
          />

          <DsRibbon :label="$t('rolls.history')" />
          <p
            v-if="!history.entries.value.length"
            class="hint"
          >
            {{ $t('rolls.empty') }}
          </p>
          <ul
            v-else
            class="history"
          >
            <li
              v-for="entry in history.entries.value"
              :key="entry.id"
              class="history__row"
            >
              <span
                class="ds-number history__result"
                :class="{ 'history__result--crit': entry.isCrit, 'history__result--fumble': entry.isFumble }"
              >{{ entry.result }}</span>
              <span class="history__body">
                <b>{{ entry.label }}</b>
                <span>{{ rollDiceText(entry) }} · {{ timeOf(entry) }}</span>
                <span
                  v-for="note in rollNotes(entry)"
                  :key="note"
                  class="history__note"
                >{{ note }}</span>
              </span>
              <DsLinkButton
                :label="$t('rolls.replay')"
                @click="replay(entry)"
              />
            </li>
          </ul>
          <DsLinkButton
            v-if="history.entries.value.length"
            class="self-start"
            :label="$t('rolls.clear')"
            @click="history.clear()"
          />
        </div>
      </DsFrame>
    </template>
  </UPopover>
</template>

<script lang="ts" setup>
import type { DsOption } from '~/components/ds/DsSegmented.vue'
import { situationLabel, type RollOverride } from '~~/shared/rules/rolls'

const { toasts, history, rollsEnabled, pending, situations, modeLabel, hasPending, pendingLabel, timeOf, replay } = useRollPanel()

const isOpen = ref(false)

const modeOptions = computed<DsOption<RollOverride>[]>(() => ROLL_OVERRIDES.map(value => ({ value, label: modeLabel(value) })))
const situationOptions = computed<DsOption<string>[]>(() => situations.value.map(value => ({ value, label: situationLabel(value) })))
</script>

<style scoped>
.toasts {
  position: fixed;
  top: 14px;
  right: 16px;
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.trigger {
  position: fixed;
  right: 16px;
  bottom: calc(14px + var(--sheet-bottom-inset, 0px));
  z-index: 45;
}

.panel {
  width: 340px;
  font-family: var(--font-atkinson);
  color: var(--color-ds-ink);
}

.panel__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: min(70dvh, 560px);
  overflow-y: auto;
}

.hint {
  font-size: 12px;
  color: var(--color-ds-mute);
}

.history {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.history__row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.history__result {
  width: 34px;
  flex-shrink: 0;
  font-size: 20px;
  text-align: right;
}

.history__result--crit { color: var(--color-ds-gold); }
.history__result--fumble { color: var(--color-ds-bad); }

.history__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  font-size: 12px;
  color: var(--color-ds-mute);
}

.history__body b {
  font-size: 12.5px;
  color: var(--color-ds-ink);
}
</style>
