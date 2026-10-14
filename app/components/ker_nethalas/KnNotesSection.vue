<template>
  <UCard>
    <div class="grid gap-4 md:grid-cols-2">
      <UFormField label="Autres objectifs">
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

      <fieldset class="space-y-2 md:col-span-2">
        <legend class="mb-2 text-sm font-medium">
          Atouts
        </legend>
        <div class="grid gap-3 sm:grid-cols-2">
          <UCheckbox
            v-for="key in KN_PERK_KEYS"
            :key
            :model-value="character.perkKeys.includes(key)"
            :label="$t(`ker_nethalas.perks.${key}.name`)"
            :description="$t(`ker_nethalas.perks.${key}.hint`)"
            @update:model-value="togglePerk(key)"
          />
        </div>
      </fieldset>

      <UFormField label="Autres atouts">
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
import { KN_PERK_KEYS, type KnPerkKey } from '~~/shared/ker-nethalas/perks'

const character = defineModel<KnCharacter>('character', { required: true })

function togglePerk(key: KnPerkKey) {
  const keys = character.value.perkKeys
  character.value.perkKeys = keys.includes(key) ? keys.filter(other => other !== key) : [...keys, key]
}
</script>
