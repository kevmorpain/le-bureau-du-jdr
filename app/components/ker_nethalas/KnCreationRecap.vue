<template>
  <div class="flex min-h-screen flex-col bg-(--ui-bg)">
    <header class="sticky top-0 z-50 flex h-11 items-center gap-3 border-b border-(--ui-border) bg-(--ui-bg-elevated) px-4 shadow-sm">
      <button
        type="button"
        class="cursor-pointer text-xs text-muted transition-colors hover:text-(--ui-text)"
        @click="emit('back')"
      >
        ← Modifier
      </button>
      <USeparator
        orientation="vertical"
        class="h-4"
      />
      <span class="text-sm font-bold text-(--ui-text)">Récapitulatif</span>
    </header>

    <div class="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-8">
      <p class="text-sm text-muted">
        Vérifiez le survivant. « Créer le survivant » crée la fiche ; tout reste modifiable ensuite.
      </p>

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

      <UButton
        size="lg"
        :disabled="!canCreate"
        :loading="creating"
        @click="emit('create')"
      >
        Créer le survivant
      </UButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { KnCreationDraft, KnCreationStepId } from '~/composables/useKnCreation'
import type { KnMastery } from '~~/shared/ker-nethalas/masteries'

defineProps<{
  draft: KnCreationDraft
  masteries: KnMastery[] | null
  missing: readonly { id: KnCreationStepId, label: string }[]
  canCreate: boolean
  creating: boolean
}>()

const emit = defineEmits<{
  'back': []
  'create': []
  'go-to': [stepId: KnCreationStepId]
}>()
</script>
