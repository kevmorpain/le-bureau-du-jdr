<template>
  <KnCard storage-key="effects">
    <template #summary>
      {{ character.status.conditions.length }} condition{{ character.status.conditions.length > 1 ? 's' : '' }} · {{ character.status.custom.length }} effet{{ character.status.custom.length > 1 ? 's' : '' }} personnalisé{{ character.status.custom.length > 1 ? 's' : '' }}
    </template>
    <template #header>
      <KnCardHeader title="Effets en cours">
        Activez ce qui s'applique : les scores effectifs se mettent à jour. L'Épuisement se règle dans les jauges.
      </KnCardHeader>
    </template>

    <div class="space-y-8">
      <KnConditionsEditor v-model:status="character.status" />
      <KnCustomModifiersEditor v-model:status="character.status" />
    </div>
  </KnCard>
</template>

<script lang="ts" setup>
import type { KnCharacter } from '~~/server/utils/drizzle'

const character = defineModel<KnCharacter>('character', { required: true })
</script>
