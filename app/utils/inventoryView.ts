import type { ArmorProperties, ToolProperties, WeaponProperties } from '~~/server/db/schema/items'
import type { DamageTypeKey } from '~~/server/db/schema/effects'
import { isCarried, stackWeightG } from '~~/shared/rules/encumbrance'
import { damageTypeLabels } from '~~/shared/utils/labels'
import { armorTypeLabels, toolTypeLabels, weaponCategoryLabels } from '~~/shared/utils/item'
import type { InventoryEntry, InventoryItem } from '~/composables/character/useCharacterInventory'

export const INVENTORY_CATEGORIES = ['weapon', 'armor', 'magic', 'consumable', 'gear'] as const
export type InventoryCategory = typeof INVENTORY_CATEGORIES[number]

export const INVENTORY_GROUPS = ['worn', 'consumable', 'bag'] as const
export type InventoryGroup = typeof INVENTORY_GROUPS[number]

export type InventoryState = 'attuned' | 'equipped' | 'stowed'

// Equipment categories used up when used, as the catalogue names them.
const CONSUMABLE_CATEGORIES: readonly string[] = ['Consommable', 'Nourriture', 'Munition', 'Potion']

const categoryOf = (item: InventoryItem): string | undefined => (item.properties as { category?: string }).category

export const isConsumable = (item: InventoryItem): boolean =>
  item.itemType === 'equipment' && CONSUMABLE_CATEGORIES.includes(categoryOf(item) ?? '')

// The inventory POST answers with the item without its effects: they arrive with the next GET.
export const isMagicEntry = (entry: InventoryEntry): boolean =>
  !!entry.item && (entry.item.rarity != null || (entry.item.effects?.length ?? 0) > 0 || entry.magicBonus > 0)

export const inventoryCategoryOf = (entry: InventoryEntry): InventoryCategory => {
  const item = entry.item
  if (!item) return 'gear'
  if (isMagicEntry(entry)) return 'magic'
  if (item.itemType === 'weapon') return 'weapon'
  if (item.itemType === 'armor') return 'armor'
  return isConsumable(item) ? 'consumable' : 'gear'
}

export const inventoryGroupOf = (entry: InventoryEntry): InventoryGroup => {
  if (entry.equipped || entry.attuned) return 'worn'
  return entry.item && isConsumable(entry.item) ? 'consumable' : 'bag'
}

export const inventoryStateOf = (entry: InventoryEntry): InventoryState =>
  entry.attuned ? 'attuned' : entry.equipped ? 'equipped' : 'stowed'

export const entryWeightG = (entry: InventoryEntry): number => {
  const item = entry.item
  if (!item) return 0
  return stackWeightG({ quantity: entry.quantity, weightG: item.weightG, lotSize: item.lotSize ?? 1, carried: isCarried(item.itemType, categoryOf(item)) })
}

export const isBodyArmor = (item: InventoryItem | null | undefined): boolean =>
  item?.itemType === 'armor' && (item.properties as ArmorProperties).armor_type !== 'shield'

export const weaponDamageSummary = (item: InventoryItem): string => {
  const { damage_dice: dice, damage_type: type } = item.properties as WeaponProperties
  return `${dice} ${(damageTypeLabels[type as DamageTypeKey] ?? type).toLowerCase()}`
}

export const weaponRangeSummary = (item: InventoryItem): string | null => {
  const { range, weapon_properties: properties, weapon_category: category } = item.properties as WeaponProperties
  if (!range || (!properties.includes('thrown') && !category.endsWith('ranged'))) return null
  return `${range.normal} m / ${range.long} m`
}

export const armorClassSummary = (item: InventoryItem): string => {
  const { armor_type: type, base_ac: base, dex_limit: dexLimit } = item.properties as ArmorProperties
  if (type === 'shield') return '+2 CA'
  const dex = dexLimit === null ? '+DEX' : dexLimit === 0 ? '' : `+DEX (max +${dexLimit})`
  return `CA ${base}${dex}`
}

export const itemKindLabel = (item: { itemType: InventoryItem['itemType'], properties: unknown }): string => {
  if (item.itemType === 'weapon') return weaponCategoryLabels[(item.properties as WeaponProperties).weapon_category] ?? 'Arme'
  if (item.itemType === 'armor') return armorTypeLabels[(item.properties as ArmorProperties).armor_type] ?? 'Armure'
  if (item.itemType === 'tool') {
    const props = item.properties as ToolProperties
    return toolTypeLabels[props.tool_type] ?? props.category
  }
  return (item.properties as { category?: string }).category || 'Équipement'
}
