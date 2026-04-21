<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-medium">Effets magiques</h3>
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
      Aucun effet magique
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

      <!-- extra_damage -->
      <div v-if="effect.type === 'extra_damage'" class="grid grid-cols-2 gap-2">
        <UFormField label="Dés de dégâts">
          <UInput
            v-model="(effect.value as ExtraDamageValue).die_count_notation"
            placeholder="ex: 1d6"
            size="sm"
          />
        </UFormField>
        <UFormField label="Type de dégâts">
          <USelect
            v-model="(effect.value as ExtraDamageValue).damage_type"
            :items="damageTypeOptions"
            size="sm"
          />
        </UFormField>
      </div>

      <!-- damage_resistance -->
      <div v-else-if="effect.type === 'damage_resistance' || effect.type === 'damage_immunity' || effect.type === 'vulnerability'">
        <UFormField label="Type de dégâts">
          <USelect
            v-model="(effect.value as { damageType: string }).damageType"
            :items="damageTypeOptions"
            size="sm"
          />
        </UFormField>
      </div>

      <!-- ability_increase -->
      <div v-else-if="effect.type === 'ability_increase'" class="grid grid-cols-2 gap-2">
        <UFormField label="Caractéristique">
          <USelect
            v-model="(effect.value as { ability: string, amount: number }).ability"
            :items="abilityOptions"
            size="sm"
          />
        </UFormField>
        <UFormField label="Bonus">
          <UInput
            v-model.number="(effect.value as { ability: string, amount: number }).amount"
            type="number"
            :min="1"
            :max="10"
            size="sm"
          />
        </UFormField>
      </div>

      <!-- walking_speed -->
      <div v-else-if="effect.type === 'walking_speed'">
        <UFormField label="Bonus de vitesse (m)">
          <UInput
            :model-value="effect.value as number"
            type="number"
            :min="1"
            size="sm"
            @update:model-value="(v) => { effect.value = Number(v) }"
          />
        </UFormField>
      </div>

      <!-- darkvision -->
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

      <!-- weapon_proficiency -->
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

      <!-- proficiency -->
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
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Effect } from '~~/server/db/schema/effects'

interface ExtraDamageValue {
  die_count_notation: string
  damage_type: string
}

const props = defineProps<{
  modelValue: Effect[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Effect[]]
}>()

const localEffects = ref<Array<{ type: string, value: unknown }>>(
  (props.modelValue ?? []).map(e => ({ type: e.type, value: e.value })),
)

watch(localEffects, (val) => {
  emit('update:modelValue', val as Effect[])
}, { deep: true })

watch(() => props.modelValue, (val) => {
  localEffects.value = (val ?? []).map(e => ({ type: e.type, value: e.value }))
})

const effectTypeOptions = [
  { label: 'Dégâts supplémentaires', value: 'extra_damage' },
  { label: 'Résistance aux dégâts', value: 'damage_resistance' },
  { label: 'Immunité aux dégâts', value: 'damage_immunity' },
  { label: 'Vulnérabilité aux dégâts', value: 'vulnerability' },
  { label: 'Augmentation de caractéristique', value: 'ability_increase' },
  { label: 'Bonus de vitesse', value: 'walking_speed' },
  { label: 'Vision dans le noir', value: 'darkvision' },
  { label: 'Maîtrise d\'arme', value: 'weapon_proficiency' },
  { label: 'Maîtrise (armure/outil)', value: 'proficiency' },
]

const damageTypeOptions = [
  { label: 'Acide', value: 'acid' },
  { label: 'Contondant', value: 'bludgeoning' },
  { label: 'Froid', value: 'cold' },
  { label: 'Feu', value: 'fire' },
  { label: 'Force', value: 'force' },
  { label: 'Foudre', value: 'lightning' },
  { label: 'Nécrotique', value: 'necrotic' },
  { label: 'Perçant', value: 'piercing' },
  { label: 'Poison', value: 'poison' },
  { label: 'Psychique', value: 'psychic' },
  { label: 'Radiant', value: 'radiant' },
  { label: 'Tranchant', value: 'slashing' },
  { label: 'Tonnerre', value: 'thunder' },
]

const abilityOptions = [
  { label: 'Force', value: 'str' },
  { label: 'Dextérité', value: 'dex' },
  { label: 'Constitution', value: 'con' },
  { label: 'Intelligence', value: 'int' },
  { label: 'Sagesse', value: 'wis' },
  { label: 'Charisme', value: 'cha' },
]

const defaultValueForType = (type: string): unknown => {
  switch (type) {
    case 'extra_damage': return { die_count_notation: '1d6', damage_type: 'fire' }
    case 'damage_resistance':
    case 'damage_immunity':
    case 'vulnerability': return { damageType: 'fire' }
    case 'ability_increase': return { ability: 'str', amount: 2 }
    case 'walking_speed': return 9
    case 'darkvision': return { range: 18 }
    case 'weapon_proficiency': return 'simple_weapons'
    case 'proficiency': return 'light'
    default: return {}
  }
}

const onTypeChange = (index: number) => {
  const effect = localEffects.value[index]
  if (effect) {
    effect.value = defaultValueForType(effect.type)
  }
}

const addEffect = () => {
  localEffects.value.push({ type: 'extra_damage', value: defaultValueForType('extra_damage') })
}

const removeEffect = (index: number) => {
  localEffects.value.splice(index, 1)
}
</script>
