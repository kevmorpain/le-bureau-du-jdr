<template>
  <USlideover
    v-model:open="open"
    title="Ajouter un objet"
    :ui="{ body: 'overflow-y-auto' }"
  >
    <template #body>
      <div class="space-y-4 p-4">
        <!-- Tabs : Chercher / Créer -->
        <UTabs
          v-model="activeTab"
          :items="tabItems"
        />

        <!-- ── Onglet Chercher ───────────────────────────────────────── -->
        <template v-if="activeTab === 'search'">
          <div class="space-y-3">
            <!-- Filtres -->
            <div class="flex gap-2">
              <UInput
                v-model="searchQuery"
                icon="i-heroicons:magnifying-glass"
                placeholder="Rechercher un objet..."
                class="flex-1"
                @input="onSearchInput"
              />
              <USelect
                v-model="typeFilter"
                :items="typeFilterOptions"
                class="w-36"
              />
            </div>

            <!-- Résultats -->
            <div
              v-if="isSearching"
              class="text-center py-8 text-muted"
            >
              <UIcon name="i-heroicons:arrow-path" class="size-5 animate-spin" />
            </div>

            <div
              v-else-if="filteredItems.length === 0"
              class="text-center py-8 text-muted text-sm"
            >
              Aucun objet trouvé
            </div>

            <div v-else class="space-y-1 max-h-56 overflow-y-auto">
              <button
                v-for="item in filteredItems"
                :key="item.id"
                class="w-full text-left rounded-lg p-2.5 hover:bg-elevated transition-colors"
                :class="isItemSelected(item.id) ? 'bg-elevated ring ring-primary' : ''"
                @click="toggleItem(item)"
              >
                <div class="flex items-center gap-2">
                  <UIcon
                    :name="isItemSelected(item.id) ? 'i-heroicons:check-circle-solid' : 'i-heroicons:plus-circle'"
                    :class="[
                      'size-4 shrink-0',
                      isItemSelected(item.id) ? 'text-primary' : 'text-muted',
                    ]"
                  />
                  <span class="flex-1 font-medium text-sm">{{ item.name }}</span>
                  <UBadge
                    :label="itemCategoryLabel(item)"
                    variant="soft"
                  />
                </div>
                <p
                  v-if="item.description"
                  class="text-sm text-muted mt-0.5 line-clamp-1 pl-6"
                >
                  {{ item.description }}
                </p>
              </button>
            </div>

            <!-- Objets sélectionnés -->
            <div v-if="selectedEntries.length > 0" class="space-y-2">
              <p class="text-sm font-medium text-muted">
                {{ selectedEntries.length }} objet{{ selectedEntries.length > 1 ? 's' : '' }} sélectionné{{ selectedEntries.length > 1 ? 's' : '' }}
              </p>
              <div
                v-for="entry in selectedEntries"
                :key="entry.item.id"
                class="rounded-lg bg-elevated p-2.5 border border-primary/20"
              >
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="flex-1 font-medium text-sm">{{ entry.item.name }}</span>
                  <div class="flex items-center gap-3 flex-wrap">
                    <div class="flex items-center gap-1.5">
                      <span class="text-sm text-muted">Qté</span>
                      <UInput
                        v-model.number="entry.quantity"
                        type="number"
                        :min="1"
                        size="sm"
                        class="w-16"
                      />
                    </div>
                    <USelect
                      v-if="entry.item.itemType === 'weapon' || entry.item.itemType === 'armor'"
                      v-model="entry.magicBonus"
                      :items="magicBonusOptions"
                      size="sm"
                      class="w-20"
                      placeholder="Bonus"
                    />
                    <UCheckbox
                      v-if="entry.item.itemType === 'weapon' || entry.item.itemType === 'armor'"
                      v-model="entry.equipped"
                      label="Équipé"
                    />
                  </div>
                  <button
                    class="text-muted hover:text-default flex-shrink-0"
                    @click.stop="deselectItem(entry.item.id)"
                  >
                    <UIcon name="i-heroicons:x-mark" class="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- ── Onglet Créer ──────────────────────────────────────────── -->
        <template v-if="activeTab === 'create'">
          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Nom" class="col-span-2">
                <UInput
                  v-model="createForm.name"
                  placeholder="Nom de l'objet"
                />
              </UFormField>
              <UFormField label="Type">
                <USelect
                  v-model="createForm.itemType"
                  :items="typeCreateOptions"
                />
              </UFormField>
              <UFormField label="Quantité">
                <UInput
                  v-model.number="createForm.quantity"
                  type="number"
                  :min="1"
                />
              </UFormField>
            </div>

            <UFormField label="Description">
              <UTextarea
                v-model="createForm.description"
                placeholder="Description..."
                :rows="3"
              />
            </UFormField>

            <!-- Champs spécifiques par type -->
            <template v-if="createForm.itemType === 'weapon'">
              <div class="grid grid-cols-2 gap-3">
                <UFormField label="Dés de dégâts">
                  <UInput v-model="createForm.weaponProps.damage_dice" placeholder="1d6" size="sm" />
                </UFormField>
                <UFormField label="Type de dégâts">
                  <USelect v-model="createForm.weaponProps.damage_type" :items="damageTypeOptions" size="sm" />
                </UFormField>
              </div>
              <UFormField label="Catégorie d'arme">
                <USelect v-model="createForm.weaponProps.weapon_category" :items="weaponCategoryOptions" size="sm" />
              </UFormField>
            </template>

            <template v-if="createForm.itemType === 'armor'">
              <div class="grid grid-cols-2 gap-3">
                <UFormField label="Type d'armure">
                  <USelect v-model="createForm.armorProps.armor_type" :items="armorTypeOptions" size="sm" />
                </UFormField>
                <UFormField label="CA de base">
                  <UInput v-model.number="createForm.armorProps.base_ac" type="number" :min="1" size="sm" />
                </UFormField>
              </div>
              <UFormField label="Désavantage Discrétion">
                <UCheckbox v-model="createForm.armorProps.stealth_disadvantage" label="Oui" />
              </UFormField>
            </template>

            <template v-if="createForm.itemType === 'equipment'">
              <UFormField label="Catégorie">
                <USelect
                  v-model="createForm.category"
                  :items="equipmentCategoryOptions"
                  size="sm"
                />
              </UFormField>
            </template>

            <template v-if="createForm.itemType === 'tool'">
              <UFormField label="Type d'outil">
                <USelect
                  v-model="createForm.toolType"
                  :items="toolTypeOptions"
                  size="sm"
                />
              </UFormField>
              <UFormField label="Catégorie">
                <UInput
                  v-model="createForm.category"
                  placeholder="ex: Outils d'artisan"
                  size="sm"
                />
              </UFormField>
            </template>
          </div>
        </template>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 p-4">
        <UButton
          variant="ghost"
          @click="open = false"
        >
          Annuler
        </UButton>
        <UButton
          :disabled="!canSubmit"
          :loading="isSubmitting"
          @click="submit"
        >
          Ajouter
        </UButton>
      </div>
    </template>
  </USlideover>
</template>

<script lang="ts" setup>
import { weaponCategoryLabels, armorTypeLabels, toolTypeLabels } from '~~/shared/utils/item'

interface ItemResult {
  id: number
  name: string
  itemType: 'weapon' | 'armor' | 'equipment' | 'tool'
  properties: Record<string, unknown>
  description: string | null
}

interface SelectedEntry {
  item: ItemResult
  quantity: number
  equipped: boolean
  magicBonus: number
}

const props = defineProps<{
  characterSheet: CharacterSheet
}>()

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  added: []
}>()

const { addItem } = useCharacterSheet(toRef(props, 'characterSheet'))
const toast = useToast()

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const activeTab = ref('search')
const tabItems = [
  { label: 'Chercher', value: 'search' },
  { label: 'Créer un objet', value: 'create' },
]

// ─── Search ───────────────────────────────────────────────────────────────────

const searchQuery = ref('')
const typeFilter = ref('all')
const allItems = ref<ItemResult[]>([])
const isSearching = ref(false)
const selectedEntries = ref<SelectedEntry[]>([])

const typeFilterOptions = [
  { label: 'Tous les types', value: 'all' },
  { label: 'Armes', value: 'weapon' },
  { label: 'Armures', value: 'armor' },
  { label: 'Équipement', value: 'equipment' },
  { label: 'Outils', value: 'tool' },
]

const filteredItems = computed(() => {
  let items = allItems.value
  if (typeFilter.value !== 'all') items = items.filter(i => i.itemType === typeFilter.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    items = items.filter(i => i.name.toLowerCase().includes(q))
  }
  return items
})

const itemCategoryLabel = (item: ItemResult): string => {
  if (item.itemType === 'weapon') {
    const cat = (item.properties as { weapon_category?: string }).weapon_category ?? ''
    return weaponCategoryLabels[cat] ?? 'Arme'
  }
  if (item.itemType === 'armor') {
    const type = (item.properties as { armor_type?: string }).armor_type ?? ''
    return armorTypeLabels[type] ?? 'Armure'
  }
  if (item.itemType === 'tool') {
    const type = (item.properties as { tool_type?: string }).tool_type ?? ''
    return toolTypeLabels[type] ?? 'Outil'
  }
  const cat = (item.properties as { category?: string }).category ?? ''
  return cat || 'Équipement'
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null

const onSearchInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(fetchItems, 300)
}

const fetchItems = async () => {
  isSearching.value = true
  try {
    const params = new URLSearchParams()
    if (typeFilter.value !== 'all') params.set('type', typeFilter.value)
    const data = await $fetch<ItemResult[]>(`/api/items?${params.toString()}`)
    allItems.value = data
  } finally {
    isSearching.value = false
  }
}

watch(typeFilter, fetchItems)

onMounted(fetchItems)

const isItemSelected = (id: number) => selectedEntries.value.some(e => e.item.id === id)

const toggleItem = (item: ItemResult) => {
  const idx = selectedEntries.value.findIndex(e => e.item.id === item.id)
  if (idx >= 0) {
    selectedEntries.value.splice(idx, 1)
  } else {
    selectedEntries.value.push({ item, quantity: 1, equipped: false, magicBonus: 0 })
  }
}

const deselectItem = (id: number) => {
  const idx = selectedEntries.value.findIndex(e => e.item.id === id)
  if (idx >= 0) selectedEntries.value.splice(idx, 1)
}

// ─── Magic bonus options ──────────────────────────────────────────────────────

const magicBonusOptions = [
  { label: 'Aucun', value: 0 },
  { label: '+1', value: 1 },
  { label: '+2', value: 2 },
  { label: '+3', value: 3 },
]

// ─── Create form ──────────────────────────────────────────────────────────────

const createForm = ref({
  name: '',
  itemType: 'equipment' as 'weapon' | 'armor' | 'equipment' | 'tool',
  description: '',
  quantity: 1,
  category: 'Aventure',
  toolType: 'other' as 'artisan' | 'gaming' | 'musical' | 'other',
  weaponProps: {
    damage_dice: '1d6',
    damage_type: 'slashing',
    weapon_category: 'simple_melee' as string,
    weapon_properties: [] as string[],
  },
  armorProps: {
    armor_type: 'light' as string,
    base_ac: 11,
    dex_limit: null as number | null,
    stealth_disadvantage: false,
  },
})

const typeCreateOptions = [
  { label: 'Arme', value: 'weapon' },
  { label: 'Armure', value: 'armor' },
  { label: 'Équipement', value: 'equipment' },
  { label: 'Outil', value: 'tool' },
]

const damageTypeOptions = [
  { label: 'Tranchant', value: 'slashing' },
  { label: 'Perçant', value: 'piercing' },
  { label: 'Contondant', value: 'bludgeoning' },
  { label: 'Acide', value: 'acid' },
  { label: 'Feu', value: 'fire' },
  { label: 'Foudre', value: 'lightning' },
  { label: 'Froid', value: 'cold' },
  { label: 'Force', value: 'force' },
  { label: 'Nécrotique', value: 'necrotic' },
  { label: 'Radiant', value: 'radiant' },
  { label: 'Tonnerre', value: 'thunder' },
  { label: 'Poison', value: 'poison' },
  { label: 'Psychique', value: 'psychic' },
]

const weaponCategoryOptions = [
  { label: 'Arme simple de mêlée', value: 'simple_melee' },
  { label: 'Arme simple à distance', value: 'simple_ranged' },
  { label: 'Arme de guerre de mêlée', value: 'martial_melee' },
  { label: 'Arme de guerre à distance', value: 'martial_ranged' },
]

const armorTypeOptions = [
  { label: 'Armure légère', value: 'light' },
  { label: 'Armure intermédiaire', value: 'medium' },
  { label: 'Armure lourde', value: 'heavy' },
  { label: 'Bouclier', value: 'shield' },
]

const equipmentCategoryOptions = [
  { label: 'Aventure', value: 'Aventure' },
  { label: 'Contenants', value: 'Contenants' },
  { label: 'Éclairage', value: 'Éclairage' },
  { label: 'Escalade & exploration', value: 'Escalade & exploration' },
  { label: 'Nourriture & boisson', value: 'Nourriture & boisson' },
  { label: 'Soins', value: 'Soins' },
  { label: 'Survie', value: 'Survie' },
  { label: 'Équipement de camp', value: 'Équipement de camp' },
  { label: 'Vêtements', value: 'Vêtements' },
  { label: 'Divers', value: 'Divers' },
]

const toolTypeOptions = [
  { label: 'Outils d\'artisan', value: 'artisan' },
  { label: 'Jeux', value: 'gaming' },
  { label: 'Instrument de musique', value: 'musical' },
  { label: 'Autre', value: 'other' },
]

// ─── Submit ───────────────────────────────────────────────────────────────────

const isSubmitting = ref(false)

const canSubmit = computed(() => {
  if (activeTab.value === 'search') return selectedEntries.value.length > 0
  if (activeTab.value === 'create') return createForm.value.name.trim().length > 0
  return false
})

const submit = async () => {
  isSubmitting.value = true
  try {
    if (activeTab.value === 'search') {
      for (const entry of selectedEntries.value) {
        await addItem(entry.item.id, {
          quantity: entry.quantity,
          equipped: entry.equipped,
          magicBonus: entry.magicBonus,
        })
      }
    } else if (activeTab.value === 'create') {
      const form = createForm.value
      let properties: Record<string, unknown>
      if (form.itemType === 'weapon') {
        properties = { ...form.weaponProps }
      } else if (form.itemType === 'armor') {
        properties = { ...form.armorProps }
      } else if (form.itemType === 'tool') {
        properties = { tool_type: form.toolType, category: form.category }
      } else {
        properties = { category: form.category }
      }

      let created: ItemResult
      try {
        created = await $fetch<ItemResult>('/api/items', {
          method: 'POST',
          body: {
            name: form.name,
            itemType: form.itemType,
            properties,
            description: form.description || undefined,
          },
        })
      } catch {
        toast.add({ title: 'Erreur lors de la création de l\'objet', color: 'error' })
        return
      }

      try {
        await addItem(created.id, { quantity: form.quantity })
      } catch {
        toast.add({ title: 'Erreur lors de l\'ajout à l\'inventaire', color: 'error' })
        return
      }
    }

    emit('added')
    open.value = false
    resetForm()
  } catch {
    toast.add({ title: 'Une erreur est survenue', color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  selectedEntries.value = []
  searchQuery.value = ''
  typeFilter.value = 'all'
  createForm.value = {
    name: '',
    itemType: 'equipment',
    description: '',
    quantity: 1,
    category: 'Aventure',
    toolType: 'other',
    weaponProps: { damage_dice: '1d6', damage_type: 'slashing', weapon_category: 'simple_melee', weapon_properties: [] },
    armorProps: { armor_type: 'light', base_ac: 11, dex_limit: null, stealth_disadvantage: false },
  }
}
</script>
