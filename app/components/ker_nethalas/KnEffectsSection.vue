<template>
  <UCard>
    <template #header>
      <h2 class="font-semibold">
        Effets en cours
      </h2>
      <p class="text-sm text-muted">
        Activez ce qui s'applique : les scores effectifs se mettent à jour. L'Épuisement se règle dans les jauges.
      </p>
    </template>

    <div class="space-y-8">
      <KnConditionsEditor v-model:status="character.status" />
      <KnRotMadnessEditor v-model:status="character.status" />
      <KnCustomModifiersEditor v-model:status="character.status" />
    </div>
  </UCard>
</template>

<script lang="ts" setup>
import type { KnCharacter } from '~~/server/utils/drizzle'

const character = defineModel<KnCharacter>('character', { required: true })
</script>
