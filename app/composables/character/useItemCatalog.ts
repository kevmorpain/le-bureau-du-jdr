import type { Effect } from '~~/server/db/schema/effects'
import type { ArmorProperties, EquipmentProperties, ToolProperties, WeaponProperties } from '~~/server/db/schema/items'
import { matchesSearch } from '~~/shared/utils/search'
import type { InventoryItem } from './useCharacterInventory'

export type CatalogItemType = InventoryItem['itemType']

export interface CatalogItem {
  id: number
  name: string
  itemType: CatalogItemType
  properties: Record<string, unknown>
  description: string | null
}

export interface CatalogSelection {
  item: CatalogItem
  quantity: number
  equipped: boolean
  magicBonus: number
}

export const MAGIC_BONUS_OPTIONS = [
  { label: 'Aucun', value: 0 },
  { label: '+1', value: 1 },
  { label: '+2', value: 2 },
  { label: '+3', value: 3 },
]

export const RECHARGE_TYPE_OPTIONS = [
  { label: 'Aucune', value: 'none' },
  { label: 'Repos court', value: 'short_rest' },
  { label: 'Repos long', value: 'long_rest' },
  { label: 'À l\'aube', value: 'dawn' },
] as const

export const DAMAGE_TYPE_OPTIONS = [
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

export const WEAPON_CATEGORY_OPTIONS = [
  { label: 'Arme simple de mêlée', value: 'simple_melee' },
  { label: 'Arme simple à distance', value: 'simple_ranged' },
  { label: 'Arme de guerre de mêlée', value: 'martial_melee' },
  { label: 'Arme de guerre à distance', value: 'martial_ranged' },
]

export const ARMOR_TYPE_OPTIONS = [
  { label: 'Armure légère', value: 'light' },
  { label: 'Armure intermédiaire', value: 'medium' },
  { label: 'Armure lourde', value: 'heavy' },
  { label: 'Bouclier', value: 'shield' },
]

export const OTHER_CATEGORY = '__other__'

export const EQUIPMENT_CATEGORY_OPTIONS = [
  { label: 'Aventure', value: 'Aventure' },
  { label: 'Contenants', value: 'Contenants' },
  { label: 'Éclairage', value: 'Éclairage' },
  { label: 'Escalade & exploration', value: 'Escalade & exploration' },
  { label: 'Nourriture & boisson', value: 'Nourriture & boisson' },
  { label: 'Soins', value: 'Soins' },
  { label: 'Survie', value: 'Survie' },
  { label: 'Équipement de camp', value: 'Équipement de camp' },
  { label: 'Vêtements', value: 'Vêtements' },
  { label: 'Focus magique', value: 'Focus magique' },
  { label: 'Bijou', value: 'Bijou' },
  { label: 'Divers', value: 'Divers' },
  { label: 'Autre…', value: OTHER_CATEGORY },
]

export const TOOL_TYPE_OPTIONS = [
  { label: 'Outils d\'artisan', value: 'artisan' },
  { label: 'Jeux', value: 'gaming' },
  { label: 'Instrument de musique', value: 'musical' },
  { label: 'Autre', value: 'other' },
]

type RechargeChoice = 'none' | 'short_rest' | 'long_rest' | 'dawn'

const emptyForm = () => ({
  name: '',
  itemType: 'equipment' as CatalogItemType,
  description: '',
  weightKg: null as number | null,
  costPo: null as number | null,
  quantity: 1,
  category: 'Aventure',
  categoryOther: '',
  toolType: 'other' as ToolProperties['tool_type'],
  weaponProps: { damage_dice: '1d6', damage_type: 'slashing', weapon_category: 'simple_melee', weapon_properties: [] as string[] },
  armorProps: { armor_type: 'light', base_ac: 11, dex_limit: null as number | null, stealth_disadvantage: false },
  effects: [] as Effect[],
  maxUses: null as number | null,
  rechargeType: 'none' as RechargeChoice,
  rechargeMode: 'full' as 'full' | 'dice',
  rechargeDice: '1d6+4',
})

export type CustomItemForm = ReturnType<typeof emptyForm>

// An emptied number field yields '': only a finite number is a weight or a price.
const scaled = (value: unknown, factor: number) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.round(value * factor) : null

export const useItemCatalogSearch = () => {
  const query = ref('')
  const typeFilter = ref<CatalogItemType | 'all'>('all')
  const items = ref<CatalogItem[]>([])
  const isSearching = ref(false)
  const selection = ref<CatalogSelection[]>([])

  const filteredItems = computed(() => items.value.filter(item =>
    (typeFilter.value === 'all' || item.itemType === typeFilter.value) && matchesSearch(item.name, query.value)))

  const fetchItems = async () => {
    isSearching.value = true
    try {
      const type = typeFilter.value === 'all' ? '' : `?type=${typeFilter.value}`
      items.value = await $fetch<CatalogItem[]>(`/api/items${type}`)
    } finally {
      isSearching.value = false
    }
  }

  const isSelected = (id: number) => selection.value.some(entry => entry.item.id === id)

  const toggle = (item: CatalogItem) => {
    selection.value = isSelected(item.id)
      ? selection.value.filter(entry => entry.item.id !== item.id)
      : [...selection.value, { item, quantity: 1, equipped: false, magicBonus: 0 }]
  }

  const deselect = (id: number) => {
    selection.value = selection.value.filter(entry => entry.item.id !== id)
  }

  const reset = () => {
    selection.value = []
    query.value = ''
    typeFilter.value = 'all'
  }

  return { query, typeFilter, items, filteredItems, isSearching, fetchItems, selection, isSelected, toggle, deselect, reset }
}

export const useCustomItemForm = () => {
  const form = ref(emptyForm())

  const resolvedCategory = computed(() =>
    form.value.category === OTHER_CATEGORY ? (form.value.categoryOther.trim() || 'Divers') : form.value.category)

  // Extra damage dice belong to the weapon carrying them.
  watch(() => form.value.itemType, (type) => {
    if (type !== 'weapon') form.value.effects = form.value.effects.filter(effect => effect.type !== 'weapon_damage_dice')
  })

  const buildItemBody = () => {
    const f = form.value
    const properties = f.itemType === 'weapon'
      ? { ...f.weaponProps }
      : f.itemType === 'armor'
        ? { ...f.armorProps }
        : f.itemType === 'tool' ? { tool_type: f.toolType, category: f.category } : { category: resolvedCategory.value }
    // Without dice, a recharge restores every charge.
    const hasCharges = !!f.maxUses
    const rechargeType = hasCharges && f.rechargeType !== 'none' ? f.rechargeType : null
    const rechargeDice = rechargeType && f.rechargeMode === 'dice' ? f.rechargeDice.trim() : null
    return {
      name: f.name,
      itemType: f.itemType,
      properties,
      description: f.description || undefined,
      weightG: scaled(f.weightKg, 1000),
      costCp: scaled(f.costPo, 100),
      effects: f.effects,
      maxUses: hasCharges ? f.maxUses : null,
      rechargeType,
      rechargeDice,
    }
  }

  const reset = () => {
    form.value = emptyForm()
  }

  const prefill = (item: InventoryItem) => {
    const p: Partial<WeaponProperties & ArmorProperties & EquipmentProperties & ToolProperties> = item.properties
    const isKnownCategory = item.itemType === 'equipment' && EQUIPMENT_CATEGORY_OPTIONS.some(option => option.value === p.category)
    const empty = emptyForm()
    form.value = {
      ...empty,
      name: item.name,
      itemType: item.itemType,
      description: item.description ?? '',
      weightKg: item.weightG == null ? null : item.weightG / 1000,
      costPo: item.costCp == null ? null : item.costCp / 100,
      category: item.itemType === 'equipment'
        ? (isKnownCategory ? p.category! : OTHER_CATEGORY)
        : (item.itemType === 'tool' ? (p.category ?? '') : empty.category),
      categoryOther: item.itemType === 'equipment' && !isKnownCategory ? (p.category ?? '') : '',
      toolType: item.itemType === 'tool' ? (p.tool_type ?? 'other') : 'other',
      weaponProps: item.itemType === 'weapon'
        ? {
            damage_dice: p.damage_dice ?? '1d6',
            damage_type: p.damage_type ?? 'slashing',
            weapon_category: p.weapon_category ?? 'simple_melee',
            weapon_properties: [...(p.weapon_properties ?? [])],
          }
        : empty.weaponProps,
      armorProps: item.itemType === 'armor'
        ? {
            armor_type: p.armor_type ?? 'light',
            base_ac: p.base_ac ?? 11,
            dex_limit: p.dex_limit ?? null,
            stealth_disadvantage: p.stealth_disadvantage ?? false,
          }
        : empty.armorProps,
      // A deep clone: cancelling the edit must not mutate the inventory cache.
      effects: JSON.parse(JSON.stringify(item.effects ?? [])) as Effect[],
      maxUses: item.maxUses ?? null,
      rechargeType: item.rechargeType ?? 'none',
      rechargeMode: item.rechargeDice ? 'dice' : 'full',
      rechargeDice: item.rechargeDice ?? '1d6+4',
    }
  }

  return { form, resolvedCategory, buildItemBody, reset, prefill }
}

export type AddItemsError = 'update' | 'create' | 'add'

// Catalogue items are added as they are; a custom item is created first, then added. Editing changes the item, not the entry.
export const useAddItems = (characterSheet: Ref<CharacterSheet>) => {
  const { addItem, refreshInventory } = useCharacterSheet(characterSheet)
  const { online } = useOfflineSync()

  // The inventory POST answers without the item's effects; offline, the queued entries must not be refetched away.
  const refreshAddedItems = async () => {
    if (online.value) await refreshInventory()
  }

  const addSelection = async (selection: CatalogSelection[]) => {
    for (const { item, quantity, equipped, magicBonus } of selection) {
      await addItem(item.id, { quantity: quantity || 1, equipped, magicBonus })
    }
    await refreshAddedItems()
  }

  const createAndAdd = async (body: ReturnType<ReturnType<typeof useCustomItemForm>['buildItemBody']>, quantity: number): Promise<AddItemsError | null> => {
    let created: CatalogItem
    try {
      created = await $fetch<CatalogItem>('/api/items', { method: 'POST', body })
    } catch {
      return 'create'
    }
    try {
      await addItem(created.id, { quantity })
    } catch {
      return 'add'
    }
    await refreshAddedItems()
    return null
  }

  const updateCustomItem = async (itemId: number, body: ReturnType<ReturnType<typeof useCustomItemForm>['buildItemBody']>): Promise<AddItemsError | null> => {
    try {
      await $fetch(`/api/items/${itemId}`, { method: 'PUT', body })
    } catch {
      return 'update'
    }
    await refreshInventory()
    return null
  }

  return { addSelection, createAndAdd, updateCustomItem }
}
