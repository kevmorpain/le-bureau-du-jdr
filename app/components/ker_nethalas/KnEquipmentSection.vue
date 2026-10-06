<template>
  <UCard>
    <template #header>
      <h2 class="font-semibold">
        Équipement
      </h2>
      <p class="text-sm text-muted">
        Notes libres : l'outil n'en tire aucun calcul pour l'instant.
      </p>
    </template>

    <div class="grid gap-4 md:grid-cols-2">
      <UFormField label="Armes">
        <UTextarea
          v-model="character.weapons"
          :rows="5"
          :maxlength="5000"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Résistances, vulnérabilités, etc. aux types de dégâts">
        <UTextarea
          v-model="character.damageAffinities"
          :rows="5"
          :maxlength="5000"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Tout l'équipement"
        class="md:col-span-2"
      >
        <UTextarea
          v-model="character.equipment"
          :rows="8"
          :maxlength="10000"
          class="w-full"
        />
      </UFormField>
    </div>
  </UCard>
</template>

<script lang="ts" setup>
import type { KnCharacter } from '~~/server/utils/drizzle'

const character = defineModel<KnCharacter>('character', { required: true })
</script>
