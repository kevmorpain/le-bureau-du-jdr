<template>
  <WizardShell
    title="Nouveau survivant"
    back-to="/ker-nethalas"
    back-label="← Survivants"
    :steps="[...KN_CREATION_STEPS]"
    :current-step-id="currentStepId"
    :can-go-next="canGoNext && !creating"
    :can-go-prev="canGoPrev && !creating"
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
    <KnCreationGoals
      v-else-if="currentStepId === 'goals'"
      v-model:draft="draft"
    />
    <KnCreationKit
      v-else-if="currentStepId === 'kit'"
      v-model:draft="draft"
    />
    <KnCreationRecap
      v-else
      :draft
      :complete
      @go-to="goTo"
    />

    <template #preview>
      <KnCreationSummary
        :draft
        compact
      />
    </template>
    <template #preview-mobile>
      <KnCreationSummary
        :draft
        compact
      />
    </template>
  </WizardShell>
</template>

<script lang="ts" setup>
import { KN_CREATION_STEPS, useKnCreation } from '~/composables/useKnCreation'

definePageMeta({ layout: 'blank' })

const toast = useToast()

const { draft, currentStepId, parsed, complete, canGoNext, canGoPrev, isLastStep, isStepComplete, stepSummaries, goTo, goNext, goPrev } = useKnCreation()

const creating = ref(false)

async function handleNext() {
  if (!isLastStep.value) return goNext()
  if (!parsed.value.success || creating.value) return

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
