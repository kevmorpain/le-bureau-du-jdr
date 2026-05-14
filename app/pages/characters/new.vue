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
definePageMeta({ layout: 'blank' })

const { currentStepId } = useCharacterBuilder()
const router = useRouter()

const showSummary = ref(false)
const submitting = ref(false)

async function handleSubmit() {
  // La soumission POST sera implémentée dans l'étape suivante
  submitting.value = true
  await router.push('/characters')
}
</script>
