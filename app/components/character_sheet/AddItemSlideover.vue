<template>
  <USlideover
    v-model:open="open"
    :title="isEdit ? 'Modifier l\'objet' : 'Ajouter un objet'"
    :ui="{ body: 'overflow-y-auto' }"
  >
    <template #body>
      <div class="space-y-4 p-4">
        <UTabs
          v-if="!isEdit"
          v-model="activeTab"
          :items="tabItems"
        />

        <template v-if="!isEdit && activeTab === 'search'">
          <div class="space-y-3">
            <div class="flex gap-2">
              <UInput
                v-model="searchQuery"
                icon="i-heroicons:magnifying-glass"
                placeholder="Rechercher un objet..."
                class="flex-1"
              />
              <USelect
                v-model="typeFilter"
                :items="typeFilterOptions"
                class="w-36"
              />
            </div>

            <div
              v-if="isSearching"
              class="text-center py-8 text-muted"
            >
              <UIcon
                name="i-heroicons:arrow-path"
                class="size-5 animate-spin"
              />
            </div>

            <div
              v-else-if="filteredItems.length === 0"
              class="text-center py-8 text-muted text-sm"
            >
              Aucun objet trouvé
            </div>

            <div
              v-else
              class="space-y-1 max-h-56 overflow-y-auto"
            >
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

            <div
              v-if="selectedEntries.length > 0"
              class="space-y-2"
            >
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
                    <UIcon
                      name="i-heroicons:x-mark"
                      class="size-4"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-if="isEdit || activeTab === 'create'">
          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <UFormField
                label="Nom"
                class="col-span-2"
              >
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
              <UFormField
                v-if="!isEdit"
                label="Quantité"
              >
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

            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Poids (kg)">
                <UInput
                  v-model.number="createForm.weightKg"
                  type="number"
                  :min="0"
                  step="0.1"
                  size="sm"
                />
              </UFormField>
              <UFormField label="Prix (po)">
                <UInput
                  v-model.number="createForm.costPo"
                  type="number"
                  :min="0"
                  step="0.01"
                  size="sm"
                />
              </UFormField>
            </div>

            <template v-if="createForm.itemType === 'weapon'">
              <div class="grid grid-cols-2 gap-3">
                <UFormField label="Dés de dégâts">
                  <UInput
                    v-model="createForm.weaponProps.damage_dice"
                    placeholder="1d6"
                    size="sm"
                  />
                </UFormField>
                <UFormField label="Type de dégâts">
                  <USelect
                    v-model="createForm.weaponProps.damage_type"
                    :items="damageTypeOptions"
                    size="sm"
                  />
                </UFormField>
              </div>
              <UFormField label="Catégorie d'arme">
                <USelect
                  v-model="createForm.weaponProps.weapon_category"
                  :items="weaponCategoryOptions"
                  size="sm"
                />
              </UFormField>
            </template>

            <template v-if="createForm.itemType === 'armor'">
              <div class="grid grid-cols-2 gap-3">
                <UFormField label="Type d'armure">
                  <USelect
                    v-model="createForm.armorProps.armor_type"
                    :items="armorTypeOptions"
                    size="sm"
                  />
                </UFormField>
                <UFormField label="CA de base">
                  <UInput
                    v-model.number="createForm.armorProps.base_ac"
                    type="number"
                    :min="1"
                    size="sm"
                  />
                </UFormField>
              </div>
              <UFormField label="Désavantage Discrétion">
                <UCheckbox
                  v-model="createForm.armorProps.stealth_disadvantage"
                  label="Oui"
                />
              </UFormField>
            </template>

            <template v-if="createForm.itemType === 'equipment'">
              <div class="grid grid-cols-2 gap-3">
                <UFormField label="Catégorie">
                  <USelect
                    v-model="createForm.category"
                    :items="equipmentCategoryOptions"
                    size="sm"
                  />
                </UFormField>
                <UFormField
                  v-if="createForm.category === '__other__'"
                  label="Catégorie (libre)"
                >
                  <UInput
                    v-model="createForm.categoryOther"
                    placeholder="ex: Focus magique"
                    size="sm"
                  />
                </UFormField>
              </div>
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

            <div class="rounded-lg ring ring-default p-3 space-y-3">
              <p class="text-sm font-medium">
                Charges
              </p>
              <div class="grid grid-cols-2 gap-3">
                <UFormField
                  label="Charges max"
                  help="Vide = objet sans charge"
                >
                  <UInput
                    v-model.number="createForm.maxUses"
                    type="number"
                    :min="1"
                    :max="99"
                    placeholder="ex: 7"
                    size="sm"
                  />
                </UFormField>
                <UFormField
                  v-if="createForm.maxUses"
                  label="Recharge"
                >
                  <USelect
                    v-model="createForm.rechargeType"
                    :items="rechargeTypeOptions"
                    size="sm"
                  />
                </UFormField>
              </div>
              <div
                v-if="createForm.maxUses && createForm.rechargeType !== 'none'"
                class="grid grid-cols-2 gap-3"
              >
                <UFormField label="Quantité rechargée">
                  <USelect
                    v-model="createForm.rechargeMode"
                    :items="rechargeModeOptions"
                    size="sm"
                  />
                </UFormField>
                <UFormField
                  v-if="createForm.rechargeMode === 'dice'"
                  label="Dés de recharge"
                >
                  <UInput
                    v-model="createForm.rechargeDice"
                    placeholder="ex: 1d6+4"
                    size="sm"
                  />
                </UFormField>
              </div>
            </div>

            <!-- Effets magiques (tous types) : appliqués automatiquement
                 quand l'objet est équipé. -->
            <div class="rounded-lg ring ring-default p-3">
              <MagicEffectEditor
                v-model="createForm.effects"
                :weapon="createForm.itemType === 'weapon'"
              />
            </div>
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
          {{ isEdit ? 'Enregistrer' : 'Ajouter' }}
        </UButton>
      </div>
    </template>
  </USlideover>
</template>

<script lang="ts" setup>
import type { InventoryItem } from '~/composables/character/useCharacterInventory'
import {
  ARMOR_TYPE_OPTIONS as armorTypeOptions,
  DAMAGE_TYPE_OPTIONS as damageTypeOptions,
  EQUIPMENT_CATEGORY_OPTIONS as equipmentCategoryOptions,
  MAGIC_BONUS_OPTIONS as magicBonusOptions,
  RECHARGE_TYPE_OPTIONS as rechargeTypeOptions,
  TOOL_TYPE_OPTIONS as toolTypeOptions,
  WEAPON_CATEGORY_OPTIONS as weaponCategoryOptions,
  useAddItems,
  useCustomItemForm,
  useItemCatalogSearch,
  type AddItemsError,
  type CatalogItem,
} from '~/composables/character/useItemCatalog'
import { itemKindLabel } from '~/utils/inventoryView'

const props = defineProps<{
  characterSheet: CharacterSheet
  // Edits this custom item instead of adding a new one.
  editItem?: InventoryItem | null
}>()

const open = defineModel<boolean>('open', { default: false })

const isEdit = computed(() => !!props.editItem)

const emit = defineEmits<{
  added: []
}>()

const toast = useToast()

const activeTab = ref('search')
const tabItems = [
  { label: 'Chercher', value: 'search' },
  { label: 'Créer un objet', value: 'create' },
]

const typeFilterOptions = [
  { label: 'Tous les types', value: 'all' },
  { label: 'Armes', value: 'weapon' },
  { label: 'Armures', value: 'armor' },
  { label: 'Équipement', value: 'equipment' },
  { label: 'Outils', value: 'tool' },
]

const rechargeModeOptions = [
  { label: 'Complète', value: 'full' },
  { label: 'Dés (partielle)', value: 'dice' },
]

const typeCreateOptions = [
  { label: 'Arme', value: 'weapon' },
  { label: 'Armure', value: 'armor' },
  { label: 'Équipement', value: 'equipment' },
  { label: 'Outil', value: 'tool' },
]

const {
  query: searchQuery,
  typeFilter,
  filteredItems,
  isSearching,
  fetchItems,
  selection: selectedEntries,
  isSelected: isItemSelected,
  toggle: toggleItem,
  deselect: deselectItem,
  reset: resetSearch,
} = useItemCatalogSearch()
const { form: createForm, buildItemBody, reset: resetCreate, prefill } = useCustomItemForm()
const { addSelection, createAndAdd, updateCustomItem } = useAddItems(toRef(props, 'characterSheet'))

const itemCategoryLabel = (item: CatalogItem) => itemKindLabel(item)

watch(typeFilter, fetchItems)
onMounted(fetchItems)

const isSubmitting = ref(false)

const canSubmit = computed(() => {
  if (isEdit.value) return createForm.value.name.trim().length > 0
  if (activeTab.value === 'search') return selectedEntries.value.length > 0
  if (activeTab.value === 'create') return createForm.value.name.trim().length > 0
  return false
})

const ERROR_TITLES: Record<AddItemsError, string> = {
  update: 'Erreur lors de la modification de l\'objet',
  create: 'Erreur lors de la création de l\'objet',
  add: 'Erreur lors de l\'ajout à l\'inventaire',
}

const resetForm = () => {
  resetSearch()
  resetCreate()
}

const submit = async () => {
  isSubmitting.value = true
  try {
    let error: AddItemsError | null = null
    if (isEdit.value && props.editItem) error = await updateCustomItem(props.editItem.id, buildItemBody())
    else if (activeTab.value === 'search') await addSelection(selectedEntries.value)
    else if (activeTab.value === 'create') error = await createAndAdd(buildItemBody(), createForm.value.quantity)

    if (error) {
      toast.add({ title: ERROR_TITLES[error], color: 'error' })
      return
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

watch(open, (isOpen) => {
  if (isOpen && props.editItem) prefill(props.editItem)
  else if (!isOpen) resetForm()
})
</script>
