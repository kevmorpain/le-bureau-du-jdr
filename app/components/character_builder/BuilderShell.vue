<template>
  <WizardShell
    title="Création de personnage"
    back-to="/characters"
    back-label="← Fiches"
    :steps="activeSteps"
    :current-step-id="currentStepId"
    :can-go-next="canGoNext"
    :can-go-prev="canGoPrev"
    :is-last-step="isLastStep"
    :step-summaries="stepSummaries"
    :is-step-complete="checkStep"
    @next="handleNext"
    @prev="goPrev"
    @go-to="goTo"
  >
    <slot />

    <template #header-subtitle>
      <span class="text-xs text-amber-400">D&amp;D 5e 2014</span>
    </template>

    <template #header-actions>
      <UTooltip text="Affiche le contenu d'extension gaté (Tasha, Xanathar…), masqué par défaut. Réglage global mémorisé.">
        <USwitch
          v-model="extended"
          size="md"
          label="Étendu"
        />
      </UTooltip>
      <UTooltip text="Recommencer depuis le début">
        <UButton
          variant="ghost"
          size="xs"
          color="neutral"
          icon="i-heroicons:arrow-path"
          @click="showResetConfirm = true"
        />
      </UTooltip>
    </template>

    <template #preview>
      <BuilderPreview />
    </template>

    <template #preview-mobile>
      <BuilderPreview mobile />
    </template>
  </WizardShell>

  <UModal v-model:open="showResetConfirm">
    <template #content>
      <div class="p-6">
        <h3 class="font-bold text-(--ui-text) mb-2">Recommencer ?</h3>
        <p class="text-sm text-muted mb-4">
          Toutes vos sélections seront effacées.
        </p>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="showResetConfirm = false">
            Annuler
          </UButton>
          <UButton color="error" @click="confirmReset">
            Recommencer
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
const {
  activeSteps,
  currentStepId,
  isStepComplete,
  stepSummaries,
  canGoNext,
  canGoPrev,
  isLastStep,
  goTo,
  goNext,
  goPrev,
  resetBuilder,
} = useCharacterBuilder()

// Toggle « contenu étendu » (gating source) — drapeau global persistant, surfacé ici pour
// débloquer le contenu d'extension pendant la création (ex. one-shot Tasha).
const { extended } = useExtendedContent()

const showResetConfirm = ref(false)
const emit = defineEmits<{ finish: [] }>()

function checkStep(stepId: string) {
  return isStepComplete.value(stepId)
}

function handleNext() {
  if (isLastStep.value) emit('finish')
  else goNext()
}

function confirmReset() {
  showResetConfirm.value = false
  resetBuilder()
}
</script>
