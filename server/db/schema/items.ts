import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import type { DamageTypeKey } from './effects'
import characterInventory from './character_inventory'

// ─── Weapon sub-types ─────────────────────────────────────────────────────────

export type WeaponProperty
  = | 'finesse' | 'light' | 'heavy' | 'two_handed' | 'thrown'
    | 'reach' | 'loading' | 'ammunition' | 'versatile'

export type WeaponCategory = 'simple_melee' | 'simple_ranged' | 'martial_melee' | 'martial_ranged'

export interface WeaponProperties {
  damage_dice: string // "1d6", "2d6"
  damage_type: DamageTypeKey
  weapon_category: WeaponCategory
  weapon_properties: WeaponProperty[]
  range?: { normal: number; long: number }
  versatile_damage?: string // "1d10" pour les armes polyvalentes
}

// ─── Armor sub-types ──────────────────────────────────────────────────────────

export type ArmorType = 'light' | 'medium' | 'heavy' | 'shield'

export interface ArmorProperties {
  armor_type: ArmorType
  base_ac: number
  dex_limit: number | null // null = pas de limite, 0 = sans DEX, 2 = max +2
  strength_requirement?: number
  stealth_disadvantage: boolean
}

// ─── Equipment / Tool sub-types ───────────────────────────────────────────────

export interface EquipmentProperties {
  category: string
}

export type ToolType = 'artisan' | 'gaming' | 'musical' | 'other'

export interface ToolProperties {
  tool_type: ToolType
  category: string
}

// ─── Discriminated union ──────────────────────────────────────────────────────

export type ItemType = 'weapon' | 'armor' | 'equipment' | 'tool'

export type ItemProperties = WeaponProperties | ArmorProperties | EquipmentProperties | ToolProperties

// ─── Drizzle table ────────────────────────────────────────────────────────────

const items = sqliteTable('items', {
  id: integer().primaryKey().notNull(),
  name: text('name').notNull(),
  itemType: text('item_type').$type<ItemType>().notNull(),
  properties: text('properties', { mode: 'json' }).$type<ItemProperties>().notNull(),
  description: text('description'),
  isCustom: integer('is_custom', { mode: 'boolean' }).default(false).notNull(),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$onUpdateFn(() => new Date().toISOString()),
  deletedAt: text('deleted_at'),
})

export const itemsRelations = relations(items, ({ many }) => ({
  inventoryEntries: many(characterInventory),
}))

export default items
