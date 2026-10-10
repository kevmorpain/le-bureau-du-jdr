<template>
  <div class="max-w-2xl space-y-6">
    <div>
      <h2 class="text-lg font-semibold">
        Récapitulatif
      </h2>
      <p class="text-sm text-muted">
        Vérifiez le survivant. « Terminer » crée la fiche ; tout reste modifiable ensuite.
      </p>
    </div>

    <div
      v-if="missing.length"
      class="space-y-2 rounded-md border border-warning p-3"
    >
      <p class="text-sm font-medium">
        Il reste à compléter :
      </p>
      <ul class="space-y-1 text-sm">
        <li
          v-for="step in missing"
          :key="step.id"
        >
          <UButton
            variant="link"
            size="sm"
            @click="emit('go-to', step.id)"
          >
            {{ step.label }}
          </UButton>
        </li>
      </ul>
    </div>

    <KnCreationSummary
      :draft
      :masteries
    />
  </div>
</template>

<script lang="ts" setup>
import { KN_CREATION_STEPS, type KnCreationDraft, type KnCreationStepId } from '~/composables/useKnCreation'
import type { KnMastery } from '~~/shared/ker-nethalas/masteries'

const props = defineProps<{
  draft: KnCreationDraft
  masteries: KnMastery[] | null
  complete: Record<KnCreationStepId, boolean>
}>()

const emit = defineEmits<{
  'go-to': [stepId: KnCreationStepId]
}>()

const missing = computed(() => KN_CREATION_STEPS.filter(step => step.id !== 'recap' && !props.complete[step.id]))
</script>
