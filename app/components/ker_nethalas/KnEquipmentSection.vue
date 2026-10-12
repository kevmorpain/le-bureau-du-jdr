<template>
  <UCard>
    <template #header>
      <h2 class="font-semibold">
        Équipement
      </h2>
      <p class="text-sm text-muted">
        L'inventaire pèse et range les objets ; les notes libres en dessous n'entrent dans aucun calcul.
      </p>
    </template>

    <div class="grid gap-4 md:grid-cols-2">
      <KnNumberField
        v-model="character.coins"
        label="Pièces"
        :min="KN_BOUNDS.coins.min"
        :max="KN_BOUNDS.coins.max"
        class="md:col-span-2 md:w-48"
      />

      <p class="text-sm md:col-span-2">
        <span class="font-medium">Amulette portée :</span>
        {{ amuletLabel }}
        <span class="text-muted">(à gérer dans la section Maîtrises)</span>
      </p>

      <KnInventoryPanel v-model:character="character" />

      <UFormField label="Notes sur les armes">
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
        label="Notes sur l'équipement"
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
import { KN_BOUNDS } from '~~/shared/ker-nethalas/character'
import type { KnMastery } from '~~/shared/ker-nethalas/masteries'

const props = defineProps<{
  masteries: KnMastery[] | null
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const amuletLabel = computed(() => {
  const key = character.value.amulets.equipped
  if (key === null) return 'aucune'
  const name = props.masteries?.find(mastery => mastery.key === key)?.name ?? key
  return character.value.masteryPicks.some(pick => pick.key === key) ? `${name} (Maîtrise déjà apprise : sans effet)` : name
})
</script>
