<template>
  <div
    v-if="spellcastingAbility"
    class="md:flex gap-x-4 space-y-4"
  >
    <UFormField label="Caractéristique d'incantation">
      <USelect
        v-model="spellcastingAbility"
        :items="spellcastingAbilityOptions"
        placeholder="Sélectionnez une caractéristique"
        class="min-w-32"
      />
    </UFormField>

    <div>
      <p>DD de sauvegarde des sorts</p>
      <p>{{ spellSaveDC }}</p>
    </div>

    <div>
      <p>Bonus d'attaque avec un sort</p>
      <p>{{ formatModifier(spellAttackModifier) }}</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const {
  spellcastingAbility,
  spellSaveDC,
  spellAttackModifier,
  formatModifier,
} = useCharacterSheet(toRef(props, 'characterSheet'))

const { tm, rt } = useI18n()

const spellcastingAbilityOptions = computed<{ label: string, value: string }[]>(() => {
  return Object.entries(tm('ability_scores')).map(([value, label]) => ({
    label: rt(label),
    value,
  }))
})
</script>
