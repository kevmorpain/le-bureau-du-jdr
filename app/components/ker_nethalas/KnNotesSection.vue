<template>
  <KnCard
    storage-key="notes"
    :default-open="false"
  >
    <template #header>
      <KnCardHeader title="Notes et atouts" />
    </template>

    <div class="grid gap-4 @xl:grid-cols-2">
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

      <fieldset class="space-y-2 @xl:col-span-2">
        <legend class="mb-2 text-sm font-medium">
          Atouts
        </legend>
        <div class="grid gap-3 @sm:grid-cols-2">
          <UCheckbox
            v-for="key in KN_PERK_KEYS"
            :key
            :model-value="activePerks.includes(key)"
            :disabled="fromGoals.includes(key)"
            :label="$t(`ker_nethalas.perks.${key}.name`)"
            :description="fromGoals.includes(key) ? `${$t(`ker_nethalas.perks.${key}.hint`)} (donné par un objectif)` : $t(`ker_nethalas.perks.${key}.hint`)"
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
  </KnCard>
</template>

<script lang="ts" setup>
import type { KnCharacter } from '~~/server/utils/drizzle'
import { knActivePerks, knGoalPerks } from '~~/shared/ker-nethalas/goalEffects'
import { KN_PERK_KEYS, type KnPerkKey } from '~~/shared/ker-nethalas/perks'

const character = defineModel<KnCharacter>('character', { required: true })

const fromGoals = computed(() => knGoalPerks(character.value.goalEffects))
const activePerks = computed(() => knActivePerks(character.value.perkKeys, character.value.goalEffects))

function togglePerk(key: KnPerkKey) {
  const keys = character.value.perkKeys
  character.value.perkKeys = keys.includes(key) ? keys.filter(other => other !== key) : [...keys, key]
}
</script>
