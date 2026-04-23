<template>
  <div v-if="characterSheet">
    <UPageHeader>
      <template #title>
        <CharacterNameSection :character-sheet />
      </template>

      <template #description>
        <div class="lg:flex lg:justify-between lg:items-center gap-x-4 space-y-2 lg:space-y-0">
          <div>
            <ClassesSection :character-sheet />
            <LevelSection :character-sheet />
          </div>

          <div class="flex items-start gap-1.5">
            <HitDiceSection :character-sheet />

            <DeathSavingThrowSection :character-sheet />
          </div>
        </div>
      </template>

      <template #links>
        <UButton
          icon="i-game-icons:forest-camp"
          variant="outline"
          :loading="isResting"
          @click="shortRest()"
        >
          Repos court
        </UButton>
        <UButton
          icon="i-game-icons:night-sleep"
          variant="outline"
          :loading="isResting"
          @click="longRest()"
        >
          Repos long
        </UButton>
        <UButton icon="i-heroicons:pencil">
          Modifier
        </UButton>
      </template>
    </UPageHeader>

    <UPageBody>
      <div class="lg:flex justify-between gap-4 space-y-4">
        <div class="flex gap-x-4">
          <ArmorClassSection :character-sheet />
          <HitPointsSection v-model:character-sheet="characterSheet" />
          <StatusSection :character-sheet />
        </div>

        <div class="flex gap-x-4">
          <InitiativeSection :character-sheet />

          <SpeedSection :character-sheet />

          <PassivePerceptionSection :character-sheet />

          <InspirationSection v-model:character-sheet="characterSheet" />
        </div>
      </div>

      <div class="lg:flex gap-x-12 space-y-4">
        <AbilityScoresSection v-model:character-sheet="characterSheet" />

        <div class="md:flex gap-x-4 space-y-4">
          <ProficiencyBonusSection :character-sheet />
        </div>
      </div>

      <CombatSection :character-sheet />

      <InventorySection :character-sheet />

      <CurrencySection v-model:character-sheet="characterSheet" />

      <div>
        <SpeciesTraitsSection :character-sheet />
      </div>

      <ClassFeaturesSection :character-sheet />

      <ProficienciesSection :character-sheet />

      <BackgroundSection v-model:character-sheet="characterSheet" />

      <MagicSection :character-sheet />
    </UPageBody>
  </div>
</template>

<script lang="ts" setup>
const route = useRoute()
const id = computed(() => route.params.id as string)

const { data: characterSheetData } = await useFetch<CharacterSheet>(() => `/api/character_sheets/${id.value}`)

if (!characterSheetData.value) {
  throw createError({ statusCode: 404, statusMessage: 'Fiche de personnage introuvable' })
}

const characterSheet = ref(characterSheetData.value)

const toaster = useToast()
const { shortRest, longRest, isResting } = useRest(characterSheet)

let saveTimeout: ReturnType<typeof setTimeout> | null = null

watch(characterSheet, () => {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(updateCharacterSheet, 1000)
}, {
  deep: true,
})

const updateCharacterSheet = async () => {
  if (!characterSheet.value) return

  try {
    await $fetch(`/api/character_sheets/${id.value}`, {
      method: 'PUT',
      body: characterSheet.value,
    })

    toaster.add({
      title: 'Fiche de personnage sauvegardée',
      color: 'success',
    })
  } catch (error) {
    console.error('Error saving character sheet:', error)
    toaster.add({
      title: 'Erreur lors de la sauvegarde',
      description: 'La fiche de personnage n\'a pas pu être sauvegardée.',
      color: 'error',
    })
  }
}
</script>
