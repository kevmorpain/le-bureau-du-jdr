<template>
  <!-- Écran de résumé final -->
  <BuilderSummary
    v-if="showSummary"
    :submitting="submitting"
    @back="showSummary = false"
    @submit="handleSubmit"
  />

  <!-- Wizard en 6 étapes -->
  <BuilderShell v-else @finish="showSummary = true">
    <div v-if="currentStepId === 'race'">
      <StepRace />
    </div>
    <div v-else-if="currentStepId === 'class'">
      <StepClass />
    </div>
    <div v-else-if="currentStepId === 'abilities'">
      <StepAbilities />
    </div>
    <div v-else-if="currentStepId === 'spells'">
      <StepSpells />
    </div>
    <div v-else-if="currentStepId === 'description'">
      <StepDescription />
    </div>
    <div v-else-if="currentStepId === 'equipment'">
      <StepEquipment />
    </div>
  </BuilderShell>
</template>

<script lang="ts" setup>
import { RACES, BACKGROUNDS } from '~/data/character-builder'

definePageMeta({ layout: 'blank' })

const {
  currentStepId,
  state,
  classData,
  subraceData,
  raceData,
  backgroundData,
  finalAbilities,
  hpMax,
  resetBuilder,
} = useCharacterBuilder()

const router = useRouter()
const showSummary = ref(false)
const submitting = ref(false)

async function handleSubmit() {
  if (!classData.value || !hpMax.value) return
  submitting.value = true

  try {
    // Résolution du nom de l'espèce (sous-race prioritaire)
    const speciesDbName = subraceData.value?.dbName ?? raceData.value?.dbName ?? null

    // Résolution du nom du background
    const bgData = BACKGROUNDS.find(b => b.id === state.value.backgroundId)

    // Compétences de background depuis les données frontend
    const backgroundSkills = bgData?.skillProficiencies ?? []

    const payload = {
      name: state.value.name,
      alignment: state.value.alignment ?? undefined,
      dragonbornAncestry: state.value.dragonAncestry ?? null,
      maxHp: hpMax.value,
      className: classData.value.dbName,
      subclassName: state.value.subclass ?? null,
      level: state.value.level,
      speciesDbName: speciesDbName ?? null,
      backgroundDbName: bgData?.dbName ?? null,
      personality: state.value.personality,
      ideals: state.value.ideals,
      bonds: state.value.bonds,
      flaws: state.value.flaws,
      abilityScores: Object.fromEntries(
        Object.entries(finalAbilities.value).filter(([, v]) => v != null),
      ) as Record<string, number>,
      classSkills: state.value.skills,
      backgroundSkills,
      spellIds: [...state.value.selectedCantrips, ...state.value.selectedSpells],
      inventoryItemNames: state.value.equipment,
    }

    const result = await $fetch<{ id: number }>('/api/character_sheets', {
      method: 'POST',
      body: payload,
    })

    resetBuilder()
    await router.push(`/characters/${result.id}`)
  }
  catch (e) {
    console.error('Erreur création personnage', e)
    submitting.value = false
  }
}
</script>
