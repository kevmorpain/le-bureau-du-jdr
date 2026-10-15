<template>
  <UCard>
    <template #header>
      <KnCardHeader title="Effets en cours">
        Activez ce qui s'applique : les scores effectifs se mettent à jour. L'Épuisement se règle dans les jauges.
      </KnCardHeader>
    </template>

    <div class="space-y-8">
      <KnConditionsEditor v-model:status="character.status" />
      <KnCustomModifiersEditor v-model:status="character.status" />
    </div>
  </UCard>
</template>

<script lang="ts" setup>
import type { KnCharacter } from '~~/server/utils/drizzle'

const character = defineModel<KnCharacter>('character', { required: true })
</script>
