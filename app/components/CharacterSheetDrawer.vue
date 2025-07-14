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
          <UFormField label="Niveau de personnage">
            <UInput
              v-model="characterLevel"
              type="number"
              min="1"
              max="20"
              class="w-14"
            />
          </UFormField>

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

      <div class="col-span-2">
        <p>Emplacements de sort</p>
        <ul class="flex flex-wrap justify-between gap-4 text-center">
          <li
            v-for="level in 9"
            :key="level"
          >
            <p>{{ level }}</p>

            <div class="flex items-center gap-1">
              <UButton
                icon="heroicons:minus-16-solid"
                variant="ghost"
                :disabled="spellSlots[level]!.max <= 0"
                @click="decrementMaxSpellSlot(level)"
              />

              <div
                v-if="spellSlots[level]!.max === 0"
                class="border border-dashed size-4 rounded-full opacity-50"
              />

              <ul class="flex items-center gap-1 group pointer-events-none">
                <li
                  v-for="n in spellSlots[level]!.max"
                  :key="n"
                  class="pointer-events-auto border size-4 rounded-full hover:bg-primary/50 group-hover:bg-primary/50 peer peer-hover:bg-transparent"
                  :class="{
                    'bg-primary': n <= spellSlots[level]!.current,
                  }"
                  @click="spellSlots[level]!.current = n"
                />
              </ul>

              <UButton
                icon="heroicons:plus-16-solid"
                variant="ghost"
                @click="spellSlots[level]!.max++"
              />
            </div>
          </li>
        </ul>
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
  characterLevel,
  proficiencyBonus,
  spellcastingAbility,
  spellAttackModifier,
  spellSaveDC,
  spellSlots,
} = useCharacterSheet()

const { tm, rt } = useI18n()

const spellcastingAbilityOptions = computed<{ label: string, value: string }[]>(() => {
  return Object.entries(tm('ability_scores')).map(([value, label]) => ({
    label: rt(label),
    value,
  }))
})

const decrementMaxSpellSlot = (level: number) => {
  if (spellSlots.value[level]!.max > 0) {
    spellSlots.value[level]!.max--

    if (spellSlots.value[level]!.current > spellSlots.value[level]!.max) {
      spellSlots.value[level]!.current = spellSlots.value[level]!.max
    }
  }
}
</script>
