<template>
  <div class="max-w-2xl space-y-6">
    <div>
      <h2 class="text-lg font-semibold">
        Objectifs personnels
      </h2>
      <p class="text-sm text-muted">
        Deux objectifs à la fois, choisis dans la liste du livre et non modifiables une fois pris. Notez-les ici avec leur
        récompense ; vous pourrez les mettre à jour sur la fiche.
      </p>
    </div>

    <UFormField label="Objectifs">
      <UTextarea
        v-model="draft.personalGoals"
        :rows="6"
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
