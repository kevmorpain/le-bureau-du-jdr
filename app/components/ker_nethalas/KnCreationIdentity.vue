<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-lg font-semibold">
        Identité
      </h2>
      <p class="text-sm text-muted">
        Un nom, et ce que vous voulez retenir du survivant : genre, âge, apparence, crime reproché.
      </p>
    </div>

    <UFormField
      label="Nom"
      required
    >
      <UInput
        :model-value="draft.name"
        :maxlength="100"
        autofocus
        class="w-full"
        @update:model-value="value => draft.name = String(value)"
      />
    </UFormField>

    <UFormField label="Genre, âge, apparence">
      <UTextarea
        v-model="draft.appearance"
        :rows="4"
        :maxlength="2000"
        class="w-full"
      />
    </UFormField>
  </div>
</template>

<script lang="ts" setup>
import type { KnCreationDraft } from '~/composables/useKnCreation'

const draft = defineModel<KnCreationDraft>('draft', { required: true })
</script>
