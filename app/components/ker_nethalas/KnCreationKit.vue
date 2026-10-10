<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-lg font-semibold">
        Équipement de départ
      </h2>
      <p class="text-sm text-muted">
        Une première partie ne prend rien : le Domaine d'introduction fournit l'équipement. Les parties suivantes
        commencent avec le kit ci-dessous.
      </p>
    </div>

    <USwitch
      v-model="draft.kitEnabled"
      label="Commencer avec l'équipement des parties suivantes"
    />

    <div
      v-if="draft.kitEnabled"
      class="space-y-6"
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Arme de votre choix">
          <UInput
            v-model="draft.kit.weapon"
            :maxlength="200"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Armure (tirée sur la table du livre)">
          <UInput
            v-model="draft.kit.armor"
            :maxlength="200"
            class="w-full"
          />
        </UFormField>
      </div>

      <ul class="space-y-4">
        <li
          v-for="item in ROLLED"
          :key="item.key"
          class="flex flex-wrap items-center gap-3"
        >
          <div class="w-48">
            <p class="font-medium">
              {{ item.label }}
            </p>
            <p class="text-xs text-muted">
              {{ item.formula }} ({{ KN_CREATION_KIT[item.key].min }} à {{ KN_CREATION_KIT[item.key].max }})
            </p>
          </div>
          <UInputNumber
            :model-value="draft.kit[item.key] ?? undefined"
            :min="KN_CREATION_KIT[item.key].min"
            :max="KN_CREATION_KIT[item.key].max"
            :increment="false"
            :decrement="false"
            :aria-label="item.label"
            class="w-28"
            @update:model-value="value => setKit(item.key, value)"
          />
          <UButton
            variant="soft"
            @click="draft.kit[item.key] = knRollStartingKit()[item.key]"
          >
            Lancer
          </UButton>
        </li>
      </ul>

      <p class="text-sm text-muted">
        Et 1 Torche.
      </p>

      <UButton
        variant="outline"
        @click="rollAll"
      >
        Tout lancer
      </UButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { KnCreationDraft } from '~/composables/useKnCreation'
import { KN_CREATION_KIT, knRollStartingKit } from '~~/shared/ker-nethalas/creation'

const draft = defineModel<KnCreationDraft>('draft', { required: true })

type RolledKey = 'cookingIngredients' | 'craftingSupplies' | 'coins'

const ROLLED: { key: RolledKey, label: string, formula: string }[] = [
  { key: 'cookingIngredients', label: 'Denrées', formula: 'D10' },
  { key: 'craftingSupplies', label: 'Fournitures d\'Artisanat', formula: 'D10 + 5' },
  { key: 'coins', label: 'Pièces', formula: 'D20' },
]

// Un champ vidé en cours de frappe n'est pas écrit : la valeur précédente reste.
function setKit(key: RolledKey, value: number | null | undefined) {
  if (typeof value === 'number' && Number.isFinite(value)) draft.value.kit[key] = value
}

function rollAll() {
  Object.assign(draft.value.kit, knRollStartingKit())
}
</script>
