<template>
  <!-- Écran de résumé final -->
  <LevelUpSummary
    v-if="showSummary"
    @back="showSummary = false"
  />

  <!-- Wizard par étapes -->
  <WizardShell
    v-else
    title="Montée de niveau"
    :back-to="`/characters/${id}`"
    back-label="← Fiche"
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
    <!-- Subtitle : D&D badge + char name · classes -->
    <template #header-subtitle>
      <span class="text-xs text-amber-400">D&amp;D 5e 2014</span>
      <span v-if="charSheet" class="text-xs text-muted ml-3 truncate">
        {{ charSheet.name }} · {{ charClasses.map(c => `${c.className} ${c.level}`).join(' / ') }}
      </span>
    </template>

    <!-- Step content -->
    <div v-if="status === 'pending'" class="flex items-center justify-center h-48 text-muted text-sm">
      Chargement du personnage…
    </div>
    <div v-else-if="!charSheet" class="flex items-center justify-center h-48 text-muted text-sm">
      Personnage introuvable.
    </div>
    <template v-else>
      <LevelUpStepClass v-if="currentStepId === 'class'" />
      <LevelUpStepHp v-else-if="currentStepId === 'hp'" />
      <LevelUpStepFeatures v-else-if="currentStepId === 'features'" />
      <LevelUpStepAsi v-else-if="currentStepId === 'asi'" />
      <LevelUpStepSkills v-else-if="currentStepId === 'skills'" />
      <LevelUpStepSpells v-else-if="currentStepId === 'spells'" />
    </template>

    <!-- Preview panel -->
    <template #preview>
      <LevelUpPreview v-if="charSheet" />
    </template>
    <template #preview-mobile>
      <LevelUpPreview v-if="charSheet" mobile />
    </template>
  </WizardShell>
</template>

<script lang="ts" setup>
import type { CharacterSheetWithASI } from '~/composables/useLevelUp'

definePageMeta({ layout: 'blank' })

const route = useRoute()
const id = computed(() => route.params.id as string)

const { data: charSheetData, status } = await useFetch<CharacterSheetWithASI>(
  () => `/api/character_sheets/${id.value}`,
)

const charSheet = computed(() => charSheetData.value ?? null)

// Provide charSheet to all child components
provide('charSheet', charSheet)

const {
  activeSteps,
  currentStepId,
  isStepComplete,
  stepSummaries,
  canGoNext,
  canGoPrev,
  isLastStep,
  charClasses,
  goTo,
  goNext,
  goPrev,
} = useLevelUp(charSheet)

const showSummary = ref(false)

function checkStep(stepId: string) {
  return isStepComplete.value(stepId)
}

function handleNext() {
  if (isLastStep.value) showSummary.value = true
  else goNext()
}
</script>
