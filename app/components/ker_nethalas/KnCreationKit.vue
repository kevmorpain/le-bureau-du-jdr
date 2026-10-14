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
      v-if="!draft.kitEnabled"
      class="space-y-1"
    >
      <USwitch
        v-model="draft.intro"
        label="Commencer par le Domaine d'introduction"
      />
      <p class="text-sm text-muted">
        Recommandé pour une première partie : la carte est déjà tracée, avec huit salles au contenu fixe et sa propre table de
        rencontres. Décochez pour un départ « hardcore » dans un Domaine ordinaire.
      </p>
    </div>

    <div
      v-if="draft.kitEnabled"
      class="space-y-6"
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Arme de votre choix">
          <USelect
            v-if="weapons.length"
            :model-value="draft.kit.weaponRef ?? undefined"
            :items="weapons"
            placeholder="Choisir une arme"
            class="w-full"
            @update:model-value="pickWeapon(String($event))"
          />
          <UInput
            v-else
            v-model="draft.kit.weapon"
            :maxlength="200"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Armure (tirée sur la table du livre)">
          <div
            v-if="canRollArmor"
            class="flex flex-wrap items-center gap-3"
          >
            <span class="min-w-32 flex-1">{{ draft.kit.armor || 'Aucune armure tirée' }}</span>
            <UButton
              variant="soft"
              icon="i-heroicons:cube"
              @click="rollArmor"
            >
              {{ draft.kit.armorRef ? 'Relancer' : 'Tirer une armure' }}
            </UButton>
          </div>
          <UInput
            v-else
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
import type { SelectItem } from '@nuxt/ui'
import type { KnCreationDraft } from '~/composables/useKnCreation'
import { KN_CREATION_KIT, knRollStartingKit } from '~~/shared/ker-nethalas/creation'
import type { KnCatalogItem } from '~~/shared/ker-nethalas/items'
import { knRollStartingArmor, type KnLootContent } from '~~/shared/ker-nethalas/loot'

const props = defineProps<{
  catalog: KnCatalogItem[] | null
  loot: KnLootContent | null
}>()

const draft = defineModel<KnCreationDraft>('draft', { required: true })

const weapons = computed<SelectItem[]>(() =>
  (props.catalog ?? []).filter(entry => entry.kind === 'weapon').map(entry => ({ label: entry.name, value: entry.key })),
)

const canRollArmor = computed(() => !!props.catalog && !!props.loot?.armor)

function pickWeapon(key: string) {
  const entry = props.catalog?.find(candidate => candidate.key === key)
  if (!entry) return
  draft.value.kit.weaponRef = key
  draft.value.kit.weapon = entry.name
}

function rollArmor() {
  const key = props.loot ? knRollStartingArmor(props.loot) : undefined
  const entry = props.catalog?.find(candidate => candidate.key === key)
  if (!entry) return
  draft.value.kit.armorRef = entry.key
  draft.value.kit.armor = entry.name
}

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
