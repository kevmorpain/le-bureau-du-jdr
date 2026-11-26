<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-medium">
        {{ title }}
      </h3>
      <UButton
        icon="i-heroicons:plus"
        size="xs"
        variant="ghost"
        @click="addEffect"
      >
        Ajouter un effet
      </UButton>
    </div>

    <div
      v-if="localEffects.length === 0"
      class="text-sm text-muted text-center py-2"
    >
      Aucun effet
    </div>

    <div
      v-for="(effect, index) in localEffects"
      :key="index"
      class="rounded-lg bg-elevated p-3 space-y-2"
    >
      <div class="flex items-center justify-between gap-2">
        <USelect
          v-model="effect.type"
          :items="effectTypeOptions"
          size="sm"
          class="flex-1"
          @change="onTypeChange(index)"
        />
        <UButton
          icon="i-heroicons:trash"
          size="xs"
          variant="ghost"
          color="error"
          @click="removeEffect(index)"
        />
      </div>

      <div
        v-if="effect.type === 'weapon_damage_dice'"
        class="grid grid-cols-3 gap-2"
      >
        <UFormField label="Nombre de dés">
          <UInput
            v-model.number="(effect.value as ExtraDiceValue).dice.value"
            type="number"
            :min="1"
            size="sm"
          />
        </UFormField>
        <UFormField label="Faces">
          <UInput
            v-model.number="(effect.value as ExtraDiceValue).sides"
            type="number"
            :min="2"
            size="sm"
          />
        </UFormField>
        <UFormField label="Type de dégâts">
          <USelect
            v-model="(effect.value as ExtraDiceValue).damageType"
            :items="damageTypeOptions"
            size="sm"
          />
        </UFormField>
      </div>

      <div v-else-if="effect.type === 'damage_resistance' || effect.type === 'damage_immunity' || effect.type === 'vulnerability'">
        <UFormField label="Type de dégâts">
          <USelect
            v-model="(effect.value as { damageType: string }).damageType"
            :items="damageTypeOptions"
            size="sm"
          />
        </UFormField>
      </div>

      <div
        v-else-if="effect.type === 'ability_increase'"
        class="grid grid-cols-3 gap-2"
      >
        <UFormField label="Caractéristique">
          <USelect
            v-model="(effect.value as AbilityIncreaseValue).ability"
            :items="abilityOptions"
            size="sm"
          />
        </UFormField>
        <UFormField label="Bonus">
          <UInput
            v-model.number="(effect.value as AbilityIncreaseValue).amount"
            type="number"
            :min="1"
            :max="10"
            size="sm"
          />
        </UFormField>
        <UFormField
          label="Maximum"
          hint="ex. 20"
        >
          <UInput
            v-model.number="(effect.value as AbilityIncreaseValue).max"
            type="number"
            :min="1"
            :max="30"
            size="sm"
          />
        </UFormField>
      </div>

      <div
        v-else-if="effect.type === 'ability_score_set'"
        class="grid grid-cols-2 gap-2"
      >
        <UFormField label="Caractéristique">
          <USelect
            v-model="(effect.value as AbilityScoreSetValue).ability"
            :items="abilityOptions"
            size="sm"
          />
        </UFormField>
        <UFormField label="Score fixé à">
          <UInput
            v-model.number="(effect.value as AbilityScoreSetValue).score"
            type="number"
            :min="1"
            :max="30"
            size="sm"
          />
        </UFormField>
      </div>

      <div v-else-if="effect.type === 'speed_bonus'">
        <UFormField
          label="Bonus de vitesse (m)"
          hint="négatif = malus"
        >
          <UInput
            :model-value="fixedAmount((effect.value as SpeedBonusValue).amount)"
            type="number"
            :step="1.5"
            :min="-30"
            :max="30"
            size="sm"
            @update:model-value="(v) => { (effect.value as SpeedBonusValue).amount = fixed(Number(v)) }"
          />
        </UFormField>
      </div>

      <div v-else-if="['swimming_speed', 'climbing_speed', 'burrowing_speed'].includes(effect.type)">
        <UFormField label="Vitesse (m)">
          <UInput
            :model-value="effect.value as number"
            type="number"
            :step="1.5"
            :min="1"
            size="sm"
            @update:model-value="(v) => { effect.value = Number(v) }"
          />
        </UFormField>
      </div>

      <div v-else-if="effect.type === 'darkvision'">
        <UFormField label="Portée (m)">
          <UInput
            :model-value="(effect.value as { range: number }).range"
            type="number"
            :min="1"
            size="sm"
            @update:model-value="(v) => { (effect.value as { range: number }).range = Number(v) }"
          />
        </UFormField>
      </div>

      <div v-else-if="effect.type === 'weapon_proficiency'">
        <UFormField label="Maîtrise d'arme">
          <UInput
            :model-value="effect.value as string"
            placeholder="ex: simple_weapons, longsword"
            size="sm"
            @update:model-value="(v) => { effect.value = v }"
          />
        </UFormField>
      </div>

      <div v-else-if="effect.type === 'proficiency'">
        <UFormField label="Maîtrise">
          <UInput
            :model-value="effect.value as string"
            placeholder="ex: light, medium, heavy"
            size="sm"
            @update:model-value="(v) => { effect.value = v }"
          />
        </UFormField>
      </div>

      <div
        v-else-if="effect.type === 'saving_throw_bonus'"
        class="grid grid-cols-2 gap-2"
      >
        <UFormField label="Jets de sauvegarde">
          <USelect
            v-model="(effect.value as SavingThrowBonusValue).ability"
            :items="savingThrowAbilityOptions"
            size="sm"
          />
        </UFormField>
        <UFormField
          label="Bonus"
          hint="négatif = malus"
        >
          <UInput
            v-model.number="(effect.value as SavingThrowBonusValue).amount"
            type="number"
            :min="-10"
            :max="10"
            size="sm"
          />
        </UFormField>
      </div>

      <div
        v-else-if="['armor_class_bonus', 'spell_save_dc_bonus', 'spell_attack_bonus', 'spell_damage_bonus', 'initiative_bonus', 'hp_per_level'].includes(effect.type)"
      >
        <UFormField
          label="Bonus"
          hint="négatif = malus"
        >
          <UInput
            v-model.number="(effect.value as { amount: number }).amount"
            type="number"
            :min="-10"
            :max="10"
            size="sm"
          />
        </UFormField>
      </div>

      <div
        v-else-if="effect.type === 'weapon_attack_bonus' || effect.type === 'weapon_damage_bonus'"
        class="grid grid-cols-2 gap-2"
      >
        <UFormField label="Armes concernées">
          <USelect
            v-model="(effect.value as WeaponBonusValue).weapons"
            :items="weaponScopeOptions"
            size="sm"
          />
        </UFormField>
        <UFormField
          label="Bonus"
          hint="négatif = malus"
        >
          <UInput
            v-model.number="(effect.value as WeaponBonusValue).amount"
            type="number"
            :min="-10"
            :max="10"
            size="sm"
          />
        </UFormField>
      </div>

      <div
        v-else-if="effect.type === 'advantage'"
        class="grid grid-cols-2 gap-2"
      >
        <UFormField label="Jets concernés">
          <USelect
            v-model="(effect.value as AdvantageValue).rollType"
            :items="advantageRollOptions"
            size="sm"
          />
        </UFormField>
        <UFormField label="Caractéristique">
          <USelect
            v-model="(effect.value as AdvantageValue).ability"
            :items="savingThrowAbilityOptions"
            size="sm"
          />
        </UFormField>
        <UFormField
          label="Condition"
          hint="vide : toujours ; sinon, à désigner au jet"
          class="col-span-2"
        >
          <UInput
            v-model="(effect.value as AdvantageValue).condition"
            placeholder="ex: contre l'effroi, dans le noir"
            size="sm"
          />
        </UFormField>
      </div>

      <div
        v-else-if="effect.type === 'passive_skill_bonus'"
        class="grid grid-cols-2 gap-2"
      >
        <UFormField label="Compétence">
          <USelect
            v-model="(effect.value as { skill: string }).skill"
            :items="passiveSkillOptions"
            size="sm"
          />
        </UFormField>
        <UFormField label="Bonus">
          <UInput
            v-model.number="(effect.value as { skill: string, amount: number }).amount"
            type="number"
            :min="1"
            :max="20"
            size="sm"
          />
        </UFormField>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Effect, EffectType, ExtractEffect } from '~~/server/db/schema/effects'
import { fixed, fixedAmount } from '~~/shared/utils/formula'
import {
  EFFECT_ABILITY_OPTIONS as abilityOptions,
  EFFECT_ADVANTAGE_ROLL_OPTIONS as advantageRollOptions,
  EFFECT_DAMAGE_TYPE_OPTIONS as damageTypeOptions,
  EFFECT_PASSIVE_SKILL_OPTIONS as passiveSkillOptions,
  EFFECT_SAVE_ABILITY_OPTIONS as savingThrowAbilityOptions,
  EFFECT_TYPE_OPTIONS,
  EFFECT_WEAPON_SCOPE_OPTIONS as weaponScopeOptions,
  defaultEffectValue,
} from '~/utils/effectTypes'

interface ExtraDiceValue {
  dice: { value: number }
  sides: number
  damageType: string
}

type AbilityIncreaseValue = ExtractEffect<'ability_increase'>['value']
type AbilityScoreSetValue = ExtractEffect<'ability_score_set'>['value']
type SavingThrowBonusValue = ExtractEffect<'saving_throw_bonus'>['value']
type SpeedBonusValue = ExtractEffect<'speed_bonus'>['value']
type WeaponBonusValue = ExtractEffect<'weapon_attack_bonus'>['value']
type AdvantageValue = ExtractEffect<'advantage'>['value']

const props = withDefaults(defineProps<{
  modelValue: Effect[]
  title?: string
  // Restreint les types proposés (effets temporaires : seuls ceux que la fiche applique).
  types?: readonly EffectType[]
  // Les dés de dégâts supplémentaires valent pour l'arme qui les porte : proposés sur une arme seulement.
  weapon?: boolean
}>(), {
  title: 'Effets magiques',
  types: undefined,
  weapon: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: Effect[]]
}>()

const localEffects = ref<Array<{ type: EffectType, value: unknown }>>(
  (props.modelValue ?? []).map(e => ({ type: e.type, value: e.value })),
)

// Garde anti-boucle : l'émission met à jour modelValue, ce qui re-déclenche le
// watch sur modelValue. Sans ce flag, ça part en « Maximum recursive updates ».
let syncing = false

watch(localEffects, (val) => {
  syncing = true
  emit('update:modelValue', val.map(e => ({ type: e.type, value: e.value })) as Effect[])
  nextTick(() => {
    syncing = false
  })
}, { deep: true })

watch(() => props.modelValue, (val) => {
  if (syncing) return
  localEffects.value = (val ?? []).map(e => ({ type: e.type, value: e.value }))
})

const effectTypeOptions = computed(() =>
  props.types
    ? EFFECT_TYPE_OPTIONS.filter(o => props.types!.includes(o.value))
    : EFFECT_TYPE_OPTIONS.filter(o => props.weapon || o.value !== 'weapon_damage_dice'),
)

const onTypeChange = (index: number) => {
  const effect = localEffects.value[index]
  if (effect) {
    effect.value = defaultEffectValue(effect.type)
  }
}

const addEffect = () => {
  const type = effectTypeOptions.value[0]!.value
  localEffects.value.push({ type, value: defaultEffectValue(type) })
}

const removeEffect = (index: number) => {
  localEffects.value.splice(index, 1)
}
</script>
