<template>
  <section class="space-y-3 md:col-span-2">
    <h3 class="font-medium">
      Inventaire
    </h3>

    <div class="flex flex-wrap items-center gap-2 text-sm">
      <UBadge
        :label="`Sac : ${encumbrance.used} / ${encumbrance.capacity}`"
        :color="encumbrance.over ? 'error' : 'neutral'"
        variant="subtle"
        size="md"
        :title="`Normaux ${encumbrance.normal}, lourds ${encumbrance.heavy}, légers ${encumbrance.light}, pièces et gemmes ${encumbrance.bulk}`"
      />
      <UBadge
        :label="quickSlots ? `Ceinture : ${quickUsed} / ${quickSlots}` : 'Ceinture : aucun emplacement rapide'"
        color="neutral"
        variant="subtle"
        size="md"
      />
      <UBadge
        :label="`Sur le corps : ${bodyUsed} / ${bodyMax}`"
        color="neutral"
        variant="subtle"
        size="md"
      />
      <span
        v-if="encumbrance.over"
        class="text-error"
      >Vous portez plus que votre sac ne le permet.</span>
    </div>
    <p class="text-xs text-muted">
      Dix emplacements de sac au départ ; un Sac à dos porté en ajoute 20, chaque Pochette portée 5. Les emplacements rapides
      n'existent qu'avec une Ceinture portée. Les provisions, les pièces et les amulettes non portées comptent dans le sac.
    </p>

    <ul
      v-if="inventory.length"
      class="space-y-2"
    >
      <li
        v-for="item in inventory"
        :key="item.id"
        class="flex flex-wrap items-end gap-3 rounded-md border border-default p-2"
      >
        <div class="min-w-40 flex-1">
          <p class="font-medium">
            {{ item.name }}
          </p>
          <p class="text-xs text-muted">
            {{ $t(`ker_nethalas.inventory.kinds.${item.kind}`) }} · {{ $t(`ker_nethalas.inventory.weights.${item.weight}`).toLowerCase() }}
            <span v-if="item.slot"> · case {{ item.slot }}</span>
          </p>
        </div>
        <KnNumberField
          v-if="item.place === 'bag' || item.place === 'quick'"
          :model-value="item.quantity"
          label="Quantité"
          :min="1"
          :max="9999"
          class="w-24"
          @update:model-value="setQuantity(item.id, $event)"
        />
        <UFormField label="Emplacement">
          <USelect
            :model-value="item.place"
            :items="placeItems(item)"
            class="w-60"
            :aria-label="`Emplacement de ${item.name}`"
            @update:model-value="move(item, $event as KnItemPlace)"
          />
        </UFormField>
        <UButton
          icon="i-heroicons:trash"
          color="error"
          variant="ghost"
          size="sm"
          :aria-label="`Retirer ${item.name}`"
          @click="remove(item.id)"
        />
      </li>
    </ul>
    <p
      v-else
      class="text-sm text-muted"
    >
      Aucun objet. Ajoutez ce que le survivant trouve ou achète.
    </p>

    <div
      v-if="catalog"
      class="flex flex-wrap items-end gap-3"
    >
      <UFormField label="Du catalogue du livre">
        <KnAddPicker
          :items="catalogItems"
          placeholder="Choisir un objet"
          class="w-72"
          :disabled="inventory.length >= KN_MAX_ITEMS"
          @pick="addFromCatalog(String($event))"
        />
      </UFormField>
      <UCheckbox
        v-model="found"
        label="Trouvé en butin (Intégrité d'un cran en moins)"
      />
    </div>

    <form
      class="flex flex-wrap items-end gap-3"
      @submit.prevent="add"
    >
      <UFormField label="Nouvel objet">
        <UInput
          v-model="draft.name"
          :maxlength="100"
          placeholder="Nom"
          class="w-56"
        />
      </UFormField>
      <UFormField label="Type">
        <USelect
          v-model="draft.kind"
          :items="kindItems"
          class="w-48"
          @update:model-value="draft.weight = knDefaultWeight(draft.kind)"
        />
      </UFormField>
      <UFormField label="Encombrement">
        <USelect
          v-model="draft.weight"
          :items="weightItems"
          class="w-44"
        />
      </UFormField>
      <KnNumberField
        v-model="draft.quantity"
        label="Quantité"
        :min="1"
        :max="9999"
        class="w-24"
      />
      <UButton
        type="submit"
        icon="i-heroicons:plus"
        :disabled="!draft.name.trim() || inventory.length >= KN_MAX_ITEMS"
      >
        Ajouter
      </UButton>
    </form>
  </section>
</template>

<script lang="ts" setup>
import type { SelectItem } from '@nuxt/ui'
import type { KnCharacter } from '~~/server/utils/drizzle'
import { knItemFromCatalog, type KnCatalogItem } from '~~/shared/ker-nethalas/items'
import {
  KN_ITEM_KINDS,
  KN_ITEM_WEIGHTS,
  KN_MAX_ITEMS,
  knBodySlotCount,
  knBodySlotMax,
  knDefaultWeight,
  knEncumbrance,
  knNewItem,
  knNextItemId,
  knPlaceItem,
  knPlacesFor,
  knQuickSlotCount,
  knRemoveItem,
  type KnItem,
  type KnItemKind,
  type KnItemPlace,
  type KnItemWeight,
} from '~~/shared/ker-nethalas/inventory'

const props = defineProps<{
  catalog: KnCatalogItem[] | null
}>()

const character = defineModel<KnCharacter>('character', { required: true })

const { t } = useI18n()
const toast = useToast()

const inventory = computed(() => character.value.inventory)

const amuletsCarried = computed(() => character.value.amulets.owned.length - (character.value.amulets.equipped === null ? 0 : 1))
const provisionsCount = computed(() => Object.values(character.value.provisions).reduce((sum, count) => sum + count, 0))

const encumbrance = computed(() => knEncumbrance(inventory.value, { provisions: provisionsCount.value, coins: character.value.coins, amulets: amuletsCarried.value }))
const quickSlots = computed(() => knQuickSlotCount(inventory.value))
const quickUsed = computed(() => inventory.value.filter(item => item.place === 'quick').length)
const bodyUsed = computed(() => knBodySlotCount(inventory.value, character.value.amulets.equipped !== null))
const bodyMax = computed(() => knBodySlotMax(inventory.value))

const kindItems = KN_ITEM_KINDS.map(kind => ({ label: t(`ker_nethalas.inventory.kinds.${kind}`), value: kind }))
const weightItems = KN_ITEM_WEIGHTS.map(weight => ({ label: t(`ker_nethalas.inventory.weights.${weight}`), value: weight }))

const placeItems = (item: KnItem): SelectItem[] =>
  knPlacesFor(item.kind).map(place => ({ label: t(`ker_nethalas.inventory.places.${place}`), value: place }))

const draft = reactive<{ name: string, kind: KnItemKind, weight: KnItemWeight, quantity: number }>({ name: '', kind: 'gear', weight: 'normal', quantity: 1 })

function add() {
  const name = draft.name.trim()
  if (!name) return
  character.value.inventory = [...inventory.value, knNewItem({ name, kind: draft.kind, weight: draft.weight, quantity: draft.quantity }, knNextItemId(inventory.value))]
  draft.name = ''
  draft.quantity = 1
}

const found = ref(false)

const catalogItems = computed<SelectItem[]>(() =>
  (props.catalog ?? []).map(entry => ({ label: `${entry.name} — ${t(`ker_nethalas.inventory.kinds.${entry.kind}`).toLowerCase()}, ${entry.value} ₵`, value: entry.key })),
)

// Une provision du catalogue (Torche, Ration…) s'ajoute aux provisions, pas à l'inventaire.
function addFromCatalog(key: string) {
  const entry = props.catalog?.find(candidate => candidate.key === key)
  if (!entry) return
  if (entry.provision) {
    character.value.provisions = { ...character.value.provisions, [entry.provision]: character.value.provisions[entry.provision] + 1 }
    toast.add({ title: `${entry.name} ajouté aux provisions`, color: 'success' })
    return
  }
  character.value.inventory = [...inventory.value, knItemFromCatalog(entry, knNextItemId(inventory.value), { found: found.value })]
}

function move(item: KnItem, place: KnItemPlace) {
  if (place === item.place) return
  const result = knPlaceItem(inventory.value, item.id, place)
  if ('error' in result) {
    toast.add({ title: t(`ker_nethalas.inventory.errors.${result.error}`), color: 'warning' })
    return
  }
  character.value.inventory = result.items
}

function setQuantity(id: string, quantity: number) {
  character.value.inventory = inventory.value.map(item => item.id === id ? { ...item, quantity } : item)
}

function remove(id: string) {
  character.value.inventory = knRemoveItem(inventory.value, id)
}
</script>
