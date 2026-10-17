<template>
  <KnCard
    id="kn-identity"
    storage-key="identity"
    :default-open="false"
  >
    <template #header>
      <KnCardHeader title="Identité" />
    </template>

    <div class="grid gap-4 @sm:grid-cols-[1fr_8rem_10rem]">
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

      <div class="flex flex-wrap items-center gap-3 @sm:col-span-3">
        <p class="text-sm text-muted">
          Prochain niveau à {{ KN_LEVEL_XP }} XP : {{ character.xp }} / {{ KN_LEVEL_XP }}.
        </p>
        <UButton
          v-if="canLevelUp"
          size="sm"
          icon="i-heroicons:arrow-up-circle"
          @click="levelUpOpen = !levelUpOpen"
        >
          Monter de niveau
        </UButton>
      </div>

      <KnLevelUpPanel
        v-if="levelUpOpen && canLevelUp"
        v-model:character="character"
        :masteries
        class="@sm:col-span-3"
        @close="levelUpOpen = false"
      />

      <UFormField
        label="Genre, âge, apparence"
        class="@sm:col-span-3"
      >
        <UTextarea
          v-model="character.appearance"
          :rows="2"
          :maxlength="2000"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Entraînement"
        class="@sm:col-span-3"
      >
        <UTextarea
          v-model="character.training"
          :rows="2"
          :maxlength="2000"
          class="w-full"
        />
      </UFormField>
    </div>
  </KnCard>
</template>

<script lang="ts" setup>
import type { KnCharacter } from '~~/server/utils/drizzle'
import { KN_BOUNDS } from '~~/shared/ker-nethalas/character'
import type { KnMastery } from '~~/shared/ker-nethalas/masteries'
import { KN_LEVEL_XP, knCanLevelUp } from '~~/shared/ker-nethalas/progression'

defineProps<{
  masteries: KnMastery[] | null
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const levelUpOpen = ref(false)
const canLevelUp = computed(() => knCanLevelUp(character.value.xp))

// Un nom vidé en cours de frappe n'est pas écrit : le schéma le refuserait et l'auto-save échouerait.
function rename(value: string | number | null | undefined) {
  if (typeof value === 'string' && value.trim() !== '') character.value.name = value
}
</script>
