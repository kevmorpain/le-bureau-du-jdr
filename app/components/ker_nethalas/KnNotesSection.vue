<template>
  <UCard>
    <div class="grid gap-4 md:grid-cols-2">
      <UFormField label="Objectifs personnels">
        <UTextarea
          v-model="character.personalGoals"
          :rows="4"
          :maxlength="2000"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Maîtrises">
        <UTextarea
          v-model="character.masteries"
          :rows="4"
          :maxlength="10000"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Atouts">
        <UTextarea
          v-model="character.perks"
          :rows="4"
          :maxlength="5000"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Notes">
        <UTextarea
          v-model="character.notes"
          :rows="4"
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
