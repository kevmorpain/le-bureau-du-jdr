<template>
  <UDrawer
    v-model:open="open"
    :dismissible="false"
    :overlay="false"
    :handle="false"
    :modal="false"
    inset
    direction="top"
    :ui="{ header: 'flex items-center justify-between', body: 'grid grid-cols-2 items-start' }"
  >
    <UButton
      label="Fiche personnage"
      color="primary"
      variant="ghost"
      icon="heroicons-outline:identification"
    />

    <template #header>
      <h2 class="text-highlighted font-semibold">
        Fiche de personnage
      </h2>

      <UButton
        color="neutral"
        variant="ghost"
        icon="heroicons-solid:x-mark"
        @click="open = false"
      />
    </template>

    <template #body>
      <ul class="md:flex items-center justify-between text-center max-w-min gap-x-2">
        <li
          v-for="(_, key) in abilityScores"
          :key
          class="p-2 space-y-1"
        >
          <p
            class="font-semibold"
            :class="{
              'text-primary flex items-center gap-x-1': key === spellcastingAbility,
            }"
          >
            {{ $t(`ability_scores.${key}`) }}

            <StarsIcon
              v-if="key === spellcastingAbility"
              class="flex-none size-4"
            />
          </p>

          <UInput
            v-model="abilityScores[key]"
            :name="key"
            type="number"
            class="w-14"
          />

          <p>{{ abilityModifiers[key] }}</p>
        </li>
      </ul>

      <div class="space-y-4 md:space-y-0">
        <div class="md:flex gap-x-4 space-y-4">
          <UFormField label="Bonus de maîtrise">
            <UInput
              v-model="proficiencyBonus"
              type="number"
              min="0"
              class="w-14"
            />
          </UFormField>

          <UFormField label="Caractéristique d'incantation">
            <USelect
              v-model="spellcastingAbility"
              :items="spellcastingAbilityOptions"
              placeholder="Sélectionnez une caractéristique"
              class="min-w-32"
            />
          </UFormField>
        </div>

        <div
          v-if="spellcastingAbility"
          class="md:flex gap-x-4 space-y-4"
        >
          <div>
            <p>DD de sauvegarde des sorts</p>
            <p>{{ spellSaveDC }}</p>
          </div>

          <div>
            <p>Bonus d'attaque avec un sort</p>
            <p>{{ (spellAttackModifier! > 0 ? '+' : '') + spellAttackModifier }}</p>
          </div>
        </div>
      </div>
    </template>
  </UDrawer>
</template>

<script lang="ts" setup>
const open = defineModel<boolean>('open', {
  required: true,
})

const {
  abilityScores,
  abilityModifiers,
  proficiencyBonus,
  spellcastingAbility,
  spellSaveDC,
  spellAttackModifier,
} = useCharacterSheet()

const { tm, rt } = useI18n()

const spellcastingAbilityOptions = computed<{ label: string, value: string }[]>(() => {
  return Object.entries(tm('ability_scores')).map(([value, label]) => ({
    label: rt(label),
    value,
  }))
})
</script>
