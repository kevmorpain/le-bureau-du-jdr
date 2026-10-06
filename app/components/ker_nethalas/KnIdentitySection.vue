<template>
  <UCard>
    <div class="grid gap-4 sm:grid-cols-[1fr_8rem_10rem]">
      <UFormField label="Nom">
        <UInput
          :model-value="character.name"
          :maxlength="100"
          class="w-full"
          @update:model-value="rename"
        />
      </UFormField>

      <KnNumberField
        v-model="character.level"
        label="Niveau"
        :min="KN_BOUNDS.level.min"
        :max="KN_BOUNDS.level.max"
      />

      <KnNumberField
        v-model="character.xp"
        label="XP"
        :min="KN_BOUNDS.xp.min"
        :max="KN_BOUNDS.xp.max"
      />
    </div>
  </UCard>
</template>

<script lang="ts" setup>
import type { KnCharacter } from '~~/server/utils/drizzle'
import { KN_BOUNDS } from '~~/shared/ker-nethalas/character'

const character = defineModel<KnCharacter>('character', { required: true })

// Un nom vidé en cours de frappe n'est pas écrit : le schéma le refuserait et l'auto-save échouerait.
function rename(value: string | number | null | undefined) {
  if (typeof value === 'string' && value.trim() !== '') character.value.name = value
}
</script>
