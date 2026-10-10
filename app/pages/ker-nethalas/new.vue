<template>
  <KnCreationRecap
    v-if="showSummary"
    :draft
    :masteries
    :missing="missingSteps"
    :can-create
    :creating
    @back="showSummary = false"
    @go-to="backToStep"
    @create="create"
  />

  <WizardShell
    v-else
    title="Nouveau survivant"
    back-to="/ker-nethalas"
    back-label="← Survivants"
    :steps="[...KN_CREATION_STEPS]"
    :current-step-id="currentStepId"
    :can-go-next="canGoNext"
    :can-go-prev="canGoPrev"
    :is-last-step="isLastStep"
    :step-summaries="stepSummaries"
    :is-step-complete="isStepComplete"
    @next="handleNext"
    @prev="goPrev"
    @go-to="goTo"
  >
    <template #header-subtitle>
      <span class="text-xs text-amber-400">Ker Nethalas</span>
    </template>

    <KnCreationIdentity
      v-if="currentStepId === 'identity'"
      v-model:draft="draft"
    />
    <KnCreationVitals
      v-else-if="currentStepId === 'vitals'"
      v-model:draft="draft"
    />
    <KnCreationSkills
      v-else-if="currentStepId === 'skills'"
      v-model:draft="draft"
    />
    <KnCreationResistances
      v-else-if="currentStepId === 'resistances'"
      v-model:draft="draft"
    />
    <KnCreationMasteries
      v-else-if="currentStepId === 'masteries'"
      v-model:draft="draft"
      :masteries
    />
    <KnCreationGoals
      v-else-if="currentStepId === 'goals'"
      v-model:draft="draft"
    />
    <KnCreationKit
      v-else
      v-model:draft="draft"
    />

    <template #preview>
      <KnCreationSummary
        :draft
        :masteries
      />
    </template>
    <template #preview-mobile>
      <KnCreationSummary
        :draft
        :masteries
      />
    </template>
  </WizardShell>
</template>

<script lang="ts" setup>
import { KN_CREATION_STEPS, useKnCreation } from '~/composables/useKnCreation'
import type { KnMastery } from '~~/shared/ker-nethalas/masteries'

definePageMeta({ layout: 'blank' })

const toast = useToast()

const { data: masteries } = await useKnContent<KnMastery[]>('masteries')

const { draft, currentStepId, parsed, missingSteps, canCreate, canGoNext, canGoPrev, isLastStep, isStepComplete, stepSummaries, goTo, goNext, goPrev } = useKnCreation(masteries)

const showSummary = ref(false)
const creating = ref(false)

function handleNext() {
  if (isLastStep.value) showSummary.value = true
  else goNext()
}

function backToStep(stepId: string) {
  showSummary.value = false
  goTo(stepId)
}

async function create() {
  if (!parsed.value.success || !canCreate.value || creating.value) return

  creating.value = true
  try {
    const { id } = await $fetch<{ id: number }>('/api/ker-nethalas/characters', { method: 'POST', body: parsed.value.data })
    await navigateTo(`/ker-nethalas/${id}`)
  } catch {
    toast.add({ title: 'Erreur lors de la création', color: 'error' })
  } finally {
    creating.value = false
  }
}
</script>
