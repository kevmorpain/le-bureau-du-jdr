<template>
  <BuilderShell @finish="handleFinish">
    <!-- Étape 1 — Race -->
    <div v-if="currentStepId === 'race'">
      <StepRace />
    </div>

    <!-- Étape 2 — Classe -->
    <div v-else-if="currentStepId === 'class'">
      <StepPlaceholder step-id="class" label="Classe" icon="⚔️" description="Choisissez votre classe, votre niveau, vos compétences et votre sous-classe." />
    </div>

    <!-- Étape 3 — Caractéristiques -->
    <div v-else-if="currentStepId === 'abilities'">
      <StepPlaceholder step-id="abilities" label="Caractéristiques" icon="💪" description="Définissez vos 6 caractéristiques via tableau standard, achat de points ou jet de dés." />
    </div>

    <!-- Étape 4 — Sorts -->
    <div v-else-if="currentStepId === 'spells'">
      <StepPlaceholder step-id="spells" label="Sorts" icon="✨" description="Choisissez vos sorts mineurs et sorts connus de départ." />
    </div>

    <!-- Étape 5 — Description -->
    <div v-else-if="currentStepId === 'description'">
      <StepPlaceholder step-id="description" label="Description" icon="📜" description="Donnez un nom, un historique, un alignement et des traits de personnalité à votre personnage." />
    </div>

    <!-- Étape 6 — Équipement -->
    <div v-else-if="currentStepId === 'equipment'">
      <StepPlaceholder step-id="equipment" label="Équipement" icon="🎒" description="Choisissez l'équipement de départ de votre classe et de votre historique." />
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
