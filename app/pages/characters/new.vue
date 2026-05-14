<template>
  <BuilderShell @finish="handleFinish">
    <!-- Étape 1 — Race -->
    <div v-if="currentStepId === 'race'">
      <StepRace />
    </div>

    <!-- Étape 2 — Classe -->
    <div v-else-if="currentStepId === 'class'">
      <StepClass />
    </div>

    <!-- Étape 3 — Caractéristiques -->
    <div v-else-if="currentStepId === 'abilities'">
      <StepAbilities />
    </div>

    <!-- Étape 4 — Sorts -->
    <div v-else-if="currentStepId === 'spells'">
      <StepSpells />
    </div>

    <!-- Étape 5 — Description -->
    <div v-else-if="currentStepId === 'description'">
      <StepDescription />
    </div>

    <!-- Étape 6 — Équipement -->
    <div v-else-if="currentStepId === 'equipment'">
      <StepEquipment />
    </div>
  </BuilderShell>
</template>

<script lang="ts" setup>
definePageMeta({ layout: 'blank' })

const { currentStepId } = useCharacterBuilder()

const router = useRouter()

async function handleFinish() {
  // TODO : soumettre le personnage via POST /api/character_sheets
  // et rediriger vers la fiche créée
  await router.push('/characters')
}
</script>
