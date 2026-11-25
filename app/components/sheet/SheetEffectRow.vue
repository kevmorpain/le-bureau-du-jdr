<template>
  <div class="row">
    <span class="row__type">{{ typeLabel }}</span>
    <div class="row__fields">
      <DsSelectField
        v-if="'ability' in value"
        :model-value="value.ability"
        :options="effect.type === 'saving_throw_bonus' ? saveAbilityOptions : abilityOptions"
        :label="$t('sheet.effects.fields.ability')"
        :width="140"
        @update:model-value="update({ ability: $event })"
      />
      <DsSelectField
        v-if="'damageType' in value"
        :model-value="value.damageType"
        :options="damageTypeOptions"
        :label="$t('sheet.effects.fields.damage_type')"
        :width="140"
        @update:model-value="update({ damageType: $event })"
      />
      <DsSelectField
        v-if="'skill' in value"
        :model-value="value.skill"
        :options="passiveSkillOptions"
        :label="$t('sheet.effects.fields.skill')"
        :width="170"
        @update:model-value="update({ skill: $event })"
      />
      <DsSelectField
        v-if="'weapons' in value"
        :model-value="value.weapons"
        :options="weaponScopeOptions"
        :label="$t('sheet.effects.fields.weapons')"
        :width="130"
        @update:model-value="update({ weapons: $event })"
      />
      <DsNumberField
        v-if="effect.type === 'speed_bonus'"
        :model-value="speedAmount"
        :label="$t('sheet.effects.fields.meters')"
        :step="1.5"
        :min="-30"
        :max="30"
        @update:model-value="update({ amount: fixed($event ?? 0) })"
      />
      <DsNumberField
        v-else-if="'score' in value"
        :model-value="value.score"
        :label="$t('sheet.effects.fields.score')"
        :min="1"
        :max="30"
        @update:model-value="update({ score: $event ?? 0 })"
      />
      <DsNumberField
        v-else-if="'amount' in value"
        :model-value="value.amount as number"
        :label="$t('sheet.effects.fields.amount')"
        :min="-10"
        :max="10"
        @update:model-value="update({ amount: $event ?? 0 })"
      />
    </div>
    <DsCornerButton
      :label="$t('sheet.effects.remove_effect', { type: typeLabel })"
      @click="emit('remove')"
    />
  </div>
</template>

<script lang="ts" setup>
import type { DsOption } from '~/components/ds/DsSegmented.vue'
import type { Effect } from '~~/server/db/schema/effects'
import { fixed, fixedAmount } from '~~/shared/utils/formula'

type EffectValue = Record<string, unknown> & { ability?: string, damageType?: string, skill?: string, weapons?: string, score?: number, amount?: unknown }

const effect = defineModel<Effect>({ required: true })
const emit = defineEmits<{ remove: [] }>()

const toOptions = (list: readonly { label: string, value: string }[]): DsOption<string>[] => list.map(({ label, value }) => ({ label, value }))
const abilityOptions = toOptions(EFFECT_ABILITY_OPTIONS)
const saveAbilityOptions = toOptions(EFFECT_SAVE_ABILITY_OPTIONS)
const damageTypeOptions = toOptions(EFFECT_DAMAGE_TYPE_OPTIONS)
const passiveSkillOptions = toOptions(EFFECT_PASSIVE_SKILL_OPTIONS)
const weaponScopeOptions = toOptions(EFFECT_WEAPON_SCOPE_OPTIONS)

const value = computed(() => effect.value.value as EffectValue)
const typeLabel = computed(() => EFFECT_TYPE_OPTIONS.find(o => o.value === effect.value.type)?.label ?? effect.value.type)
const speedAmount = computed(() => (effect.value.type === 'speed_bonus' ? fixedAmount(effect.value.value.amount) ?? null : null))

const update = (patch: Record<string, unknown>) => {
  effect.value = { ...effect.value, value: { ...value.value, ...patch } } as Effect
}
</script>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: var(--color-ds-panel-raised);
}

.row__type {
  flex: 1 1 160px;
  font-size: 12.5px;
}

.row__fields {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
</style>
