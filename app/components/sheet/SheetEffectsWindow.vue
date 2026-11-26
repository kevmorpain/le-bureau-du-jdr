<template>
  <DsModal
    v-model:open="open"
    :title="$t('sheet.effects.title')"
    width="lg"
  >
    <DsRibbon :label="$t('sheet.effects.active')" />
    <ul
      v-if="activeRows.length"
      class="active"
    >
      <li
        v-for="row in activeRows"
        :key="row.key"
        class="active__row"
      >
        <span
          class="active__name"
          :class="{ 'active__name--bad': row.isHarmful }"
        >{{ row.name }}</span>
        <span class="active__rounds">
          <DsNumberField
            :model-value="row.rounds"
            :label="$t('sheet.effects.rounds_left', { name: row.name })"
            :min="0"
            :max="MAX_COUNTED_ROUNDS"
            placeholder="—"
            :width="56"
            @update:model-value="row.setRounds($event)"
          />
          {{ $t('sheet.effects.rounds') }}
        </span>
        <span class="active__lines">{{ row.lines }}</span>
        <DsLinkButton
          :label="$t('sheet.effects.remove')"
          @click="row.remove()"
        />
      </li>
    </ul>
    <p
      v-else
      class="hint"
    >
      {{ $t('sheet.effects.none') }}
    </p>

    <div class="exhaustion">
      <span class="ds-label">{{ $t('sheet.rail.exhaustion') }}</span>
      <span class="hint">{{ $t('ds.count_of', { value: exhaustionLevel, max: EXHAUSTION_MAX }) }}</span>
      <DsCounter
        v-model="exhaustionLevel"
        :max="EXHAUSTION_MAX"
        color="bad"
        :aria-label="$t('sheet.rail.exhaustion')"
      />
    </div>
    <ul
      v-if="exhaustionLevel > 0"
      class="exhaustion__lines"
    >
      <li
        v-for="line in exhaustionImpactLines.slice(0, exhaustionLevel)"
        :key="line"
      >
        {{ line }}
      </li>
    </ul>

    <DsRibbon :label="$t('sheet.effects.add_or_remove')" />
    <DsSegmented
      v-model="tab"
      :options="tabOptions"
      :label="$t('sheet.effects.add_or_remove')"
    />

    <template v-if="tab === 'condition'">
      <p class="hint">
        {{ $t('sheet.effects.condition_hint') }}
      </p>
      <DsChips
        v-model="selectedConditions"
        :options="conditionOptions"
        :label="$t('sheet.effects.conditions')"
      />
      <section
        v-if="focusedCondition"
        class="detail"
      >
        <DsGroupTitle :label="$t('sheet.effects.applies', { name: conditionLabels[focusedCondition] })" />
        <ul class="detail__rules">
          <li
            v-for="line in conditionTooltipLines[focusedCondition]"
            :key="line"
          >
            {{ line }}
          </li>
        </ul>
        <p
          v-if="automaticEffects.length"
          class="detail__auto"
        >
          {{ $t('sheet.effects.automatic', { effects: automaticEffects.join(', ') }) }}
        </p>
      </section>
    </template>

    <form
      v-else
      class="custom"
      @submit.prevent="handleAddEffect"
    >
      <div class="custom__row">
        <label class="custom__field">
          <span class="ds-label">{{ $t('sheet.effects.name') }}</span>
          <DsTextField
            v-model="draft.name"
            :label="$t('sheet.effects.name')"
            :maxlength="100"
            :width="260"
          />
        </label>
        <label class="custom__field">
          <span class="ds-label">{{ $t('sheet.effects.duration') }}</span>
          <DsNumberField
            v-model="draftRounds"
            :label="$t('sheet.effects.duration')"
            :min="1"
            :max="MAX_COUNTED_ROUNDS"
            :width="90"
          />
        </label>
      </div>
      <label class="custom__field">
        <span class="ds-label">{{ $t('sheet.effects.description') }}</span>
        <DsField class="custom__area">
          <textarea
            v-model="draft.description"
            rows="2"
            maxlength="1000"
            class="custom__textarea"
            :aria-label="$t('sheet.effects.description')"
          />
        </DsField>
      </label>

      <DsRibbon :label="$t('sheet.effects.numeric')" />
      <SheetEffectRow
        v-for="(_, index) in draft.effects"
        :key="index"
        v-model="draft.effects[index]!"
        @remove="draft.effects.splice(index, 1)"
      />
      <div class="custom__types">
        <DsLinkButton
          v-for="option in effectTypeOptions"
          :key="option.value"
          plus
          :label="option.label"
          @click="handleAddRow(option.value)"
        />
      </div>
      <p
        v-if="draft.name.trim() && !parsedDraft.success"
        class="custom__error"
      >
        {{ $t('sheet.effects.invalid') }}
      </p>
      <DsButton
        type="submit"
        variant="secondary"
        class="self-start"
        :label="$t('sheet.effects.add_effect')"
        :disabled="!parsedDraft.success"
      />
    </form>

    <template #footer="{ close }">
      <DsButton
        :label="$t('sheet.effects.done')"
        @click="close"
      />
    </template>
  </DsModal>
</template>

<script lang="ts" setup>
import type { DsOption } from '~/components/ds/DsSegmented.vue'
import { useTemporaryEffectDraft } from '~/composables/character/useTemporaryEffectDraft'
import type { ConditionKey, Effect, EffectType } from '~~/server/db/schema/effects'
import { MAX_COUNTED_ROUNDS } from '~~/shared/rules/durations'
import { conditionMechanics, conditionTooltipLines, exhaustionImpactLines } from '~~/shared/utils/condition-effects'
import { conditionLabels } from '~~/shared/utils/labels'
import { TEMPORARY_EFFECT_TYPES, type TemporaryEffect } from '~~/shared/utils/temporary_effects'

type Tab = 'condition' | 'custom'

const EXHAUSTION_MAX = 6

const characterSheet = defineModel<CharacterSheet>('characterSheet', { required: true })
const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()
const {
  temporaryEffects, saveTemporaryEffect, removeTemporaryEffect, activeConditions, toggleCondition, conditionRounds, setConditionRounds,
  exhaustionLevel, binaryConditions,
} = useCharacterSheet(characterSheet)
const { draft, parsedDraft, resetDraft, submitDraft } = useTemporaryEffectDraft(characterSheet)

const tab = ref<Tab>('condition')
const focusedCondition = ref<ConditionKey | null>(null)

watch(open, (isOpen) => {
  if (!isOpen) return
  tab.value = 'condition'
  focusedCondition.value = activeConditions.value[0] ?? null
  resetDraft()
})

const tabOptions = computed<DsOption<Tab>[]>(() => (['condition', 'custom'] as const).map(value => ({ value, label: t(`sheet.effects.tabs.${value}`) })))

const asRounds = (value: number | null) => (value && value > 0 ? Math.min(value, MAX_COUNTED_ROUNDS) : undefined)

const setEffectRounds = (entry: TemporaryEffect, value: number | null) => {
  const remaining = value === null ? undefined : Math.max(0, Math.min(value, MAX_COUNTED_ROUNDS))
  const countdown = remaining === undefined
    ? undefined
    : { rounds: Math.max(entry.countdown?.rounds ?? 1, remaining, 1), remaining }
  saveTemporaryEffect({ ...entry, countdown })
}

const activeRows = computed(() => [
  ...temporaryEffects.value.filter(entry => entry.active).map(entry => ({
    key: `effect-${entry.id}`,
    name: entry.name,
    rounds: entry.countdown?.remaining ?? null,
    lines: entry.effects.length ? entry.effects.map(effectLabel).join(' · ') : entry.description ?? '',
    isHarmful: false,
    setRounds: (value: number | null) => setEffectRounds(entry, value),
    remove: () => removeTemporaryEffect(entry.id),
  })),
  ...activeConditions.value.map(condition => ({
    key: `condition-${condition}`,
    name: conditionLabels[condition],
    rounds: conditionRounds.value[condition] ?? null,
    lines: t('sheet.rail.condition'),
    isHarmful: true,
    setRounds: (value: number | null) => setConditionRounds(condition, asRounds(value)),
    remove: () => toggleCondition(condition),
  })),
])

const conditionOptions = computed<DsOption<ConditionKey>[]>(() => binaryConditions.map(value => ({ value, label: conditionLabels[value] })))

const selectedConditions = computed({
  get: () => [...activeConditions.value],
  set: (next: ConditionKey[]) => {
    const changed = [
      ...next.filter(condition => !activeConditions.value.includes(condition)),
      ...activeConditions.value.filter(condition => !next.includes(condition)),
    ]
    for (const condition of changed) toggleCondition(condition)
    if (changed.length) focusedCondition.value = changed[0]!
  },
})

const abilityList = (abilities: string[]) => abilities.map(ability => t(`ability_scores.${ability}`)).join(t('sheet.effects.and'))

const automaticEffects = computed(() => {
  const mechanics = focusedCondition.value ? conditionMechanics[focusedCondition.value] : {}
  return [
    ...(mechanics.speedZero ? [t('sheet.effects.auto.speed_zero')] : []),
    ...(mechanics.skillDisadvantage ? [t('sheet.effects.auto.skill_disadvantage')] : []),
    ...(mechanics.attackDisadvantage ? [t('sheet.effects.auto.attack_disadvantage')] : []),
    ...(mechanics.attackAdvantage ? [t('sheet.effects.auto.attack_advantage')] : []),
    ...(mechanics.saveDisadvantage?.length ? [t('sheet.effects.auto.save_disadvantage', { abilities: abilityList(mechanics.saveDisadvantage) })] : []),
    ...(mechanics.saveAutoFail?.length ? [t('sheet.effects.auto.save_auto_fail', { abilities: abilityList(mechanics.saveAutoFail) })] : []),
    ...(mechanics.resistAllDamage ? [t('sheet.effects.auto.resist_all_damage')] : []),
    ...(mechanics.immunePoison ? [t('sheet.effects.auto.immune_poison')] : []),
    ...(mechanics.incapacitating ? [t('sheet.effects.auto.incapacitating')] : []),
  ]
})

const effectTypeOptions = EFFECT_TYPE_OPTIONS.filter(option => TEMPORARY_EFFECT_TYPES.includes(option.value as typeof TEMPORARY_EFFECT_TYPES[number]))

const draftRounds = computed({
  get: () => (typeof draft.value.rounds === 'number' ? draft.value.rounds : null),
  set: (value: number | null) => {
    draft.value.rounds = value ?? ''
  },
})

const handleAddRow = (type: EffectType) => {
  draft.value.effects.push({ type, value: defaultEffectValue(type) } as Effect)
}

const handleAddEffect = () => {
  submitDraft()
}
</script>

<style scoped>
.hint {
  font-size: 12px;
  color: var(--color-ds-mute);
}

.active {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.active__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  grid-template-areas: 'name rounds remove' 'lines lines lines';
  align-items: center;
  gap: 2px 10px;
  padding: 6px 10px;
  background: var(--color-ds-panel-raised);
}

.active__name {
  grid-area: name;
  font-size: 13px;
  font-weight: 700;
}

.active__name--bad { color: var(--color-ds-bad); }

.active__rounds {
  grid-area: rounds;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-ds-mute);
}

.active__lines {
  grid-area: lines;
  font-size: 12px;
  color: var(--color-ds-mute);
}

.exhaustion {
  display: flex;
  align-items: center;
  gap: 10px;
}

.exhaustion__lines {
  font-size: 12px;
  color: var(--color-ds-bad);
}

.detail {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  background: var(--color-ds-panel-raised);
}

.detail__rules {
  padding-left: 16px;
  font-size: 12.5px;
  list-style: disc;
}

.detail__auto {
  font-size: 12px;
  color: var(--color-ds-gold);
}

.custom {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.custom__row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.custom__field {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.custom__area { width: 100%; }
.custom__area > :deep(.field__fill) { flex: 1; }

.custom__textarea {
  width: 100%;
  min-height: 48px;
  font-size: 13px;
  color: var(--color-ds-ink);
  background: transparent;
  resize: vertical;
  outline: none;
}

.custom__types {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
}

.custom__error {
  font-size: 12px;
  color: var(--color-ds-bad);
}
</style>
