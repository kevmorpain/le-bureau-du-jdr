<template>
  <KnCard storage-key="equipment">
    <template #header>
      <KnCardHeader title="Équipement">
        L'inventaire pèse et range les objets ; les notes libres en dessous n'entrent dans aucun calcul.
      </KnCardHeader>
    </template>

    <div class="grid gap-4 @xl:grid-cols-2">
      <KnNumberField
        v-model="character.coins"
        label="Pièces"
        :min="KN_BOUNDS.coins.min"
        :max="KN_BOUNDS.coins.max"
        class="@xl:col-span-2 @xl:w-48"
      />

      <p class="text-sm @xl:col-span-2">
        <span class="font-medium">Amulette portée :</span>
        {{ amuletLabel }}
        <span class="text-muted">(à gérer dans la section Maîtrises)</span>
      </p>

      <KnInventoryPanel
        v-model:character="character"
        :catalog
        :loot
        :aging
        :resolved
      />

      <div class="@xl:col-span-2">
        <UButton
          :icon="notesOpen ? 'i-heroicons:chevron-up' : 'i-heroicons:chevron-down'"
          color="neutral"
          variant="ghost"
          size="sm"
          :aria-expanded="notesOpen"
          @click="notesOpen = !notesOpen"
        >
          Notes libres sur les armes, les affinités et l'équipement
        </UButton>
      </div>

      <template v-if="notesOpen">
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
          class="@xl:col-span-2"
        >
          <UTextarea
            v-model="character.equipment"
            :rows="8"
            :maxlength="10000"
            class="w-full"
          />
        </UFormField>
      </template>
    </div>
  </KnCard>
</template>

<script lang="ts" setup>
import type { KnCharacter } from '~~/server/utils/drizzle'
import { KN_BOUNDS } from '~~/shared/ker-nethalas/character'
import type { KnPotionAging } from '~~/shared/ker-nethalas/consumables'
import type { KnCatalogItem } from '~~/shared/ker-nethalas/items'
import type { KnLootContent } from '~~/shared/ker-nethalas/loot'
import type { KnMastery } from '~~/shared/ker-nethalas/masteries'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'

const props = defineProps<{
  masteries: KnMastery[] | null
  catalog: KnCatalogItem[] | null
  loot: KnLootContent | null
  aging: KnPotionAging | null
  resolved: KnResolvedSheet
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const notesOpen = ref(false)

const amuletLabel = computed(() => {
  const key = character.value.amulets.equipped
  if (key === null) return 'aucune'
  const name = props.masteries?.find(mastery => mastery.key === key)?.name ?? key
  return character.value.masteryPicks.some(pick => pick.key === key) ? `${name} (Maîtrise déjà apprise : sans effet)` : name
})
</script>
