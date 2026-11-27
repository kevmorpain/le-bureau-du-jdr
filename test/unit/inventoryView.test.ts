import { describe, it, expect } from 'vitest'
import { inventoryCategoryOf, inventoryGroupOf, inventoryStateOf, isBodyArmor, weaponDamageSummary, weaponRangeSummary, armorClassSummary } from '../../app/utils/inventoryView'
import type { InventoryEntry, InventoryItem } from '../../app/composables/character/useCharacterInventory'

const item = (over: Partial<InventoryItem>): InventoryItem => ({
  id: 1,
  name: 'Objet',
  itemType: 'equipment',
  properties: { category: 'Divers' },
  description: null,
  effects: [],
  maxUses: null,
  rechargeType: null,
  rechargeDice: null,
  isCustom: false,
  rarity: null,
  requiresAttunement: false,
  attunementNote: null,
  weightG: null,
  costCp: null,
  lotSize: 1,
  ...over,
})

const entry = (entryItem: InventoryItem, over: Partial<InventoryEntry> = {}): InventoryEntry => ({
  id: 1,
  characterSheetId: 1,
  itemId: entryItem.id,
  quantity: 1,
  equipped: false,
  magicBonus: 0,
  currentUses: 0,
  notes: null,
  usingTwoHanded: false,
  attuned: false,
  isPactWeapon: false,
  item: entryItem,
  ...over,
})

const sword = item({ itemType: 'weapon', properties: { damage_dice: '1d8', damage_type: 'slashing', weapon_category: 'martial_melee', weapon_properties: ['versatile'] } as InventoryItem['properties'] })
const bow = item({ itemType: 'weapon', properties: { damage_dice: '1d6', damage_type: 'piercing', weapon_category: 'simple_ranged', weapon_properties: ['ammunition'], range: { normal: 24, long: 96 } } as InventoryItem['properties'] })
const shield = item({ itemType: 'armor', properties: { armor_type: 'shield', base_ac: 2, dex_limit: 0, stealth_disadvantage: false } as InventoryItem['properties'] })
const halfPlate = item({ itemType: 'armor', properties: { armor_type: 'medium', base_ac: 15, dex_limit: 2, stealth_disadvantage: true } as InventoryItem['properties'] })

describe('classement des objets de l\'inventaire', () => {
  it('un objet magique (rareté, effet ou bonus) prime sur sa nature', () => {
    expect(inventoryCategoryOf(entry(sword))).toBe('weapon')
    expect(inventoryCategoryOf(entry(sword, { magicBonus: 1 }))).toBe('magic')
    expect(inventoryCategoryOf(entry(item({ rarity: 'uncommon' })))).toBe('magic')
    expect(inventoryCategoryOf(entry(item({ effects: [{ type: 'armor_class_bonus', value: { amount: 1 } }] as InventoryItem['effects'] })))).toBe('magic')
    expect(inventoryCategoryOf(entry(halfPlate))).toBe('armor')
  })

  it('les catégories du catalogue qui s\'épuisent sont des consommables ; le reste est de l\'équipement', () => {
    expect(inventoryCategoryOf(entry(item({ properties: { category: 'Nourriture' } })))).toBe('consumable')
    expect(inventoryCategoryOf(entry(item({ properties: { category: 'Munition' } })))).toBe('consumable')
    expect(inventoryCategoryOf(entry(item({ itemType: 'tool', properties: { tool_type: 'artisan', category: 'Outils d\'artisan' } as InventoryItem['properties'] })))).toBe('gear')
  })

  it('un objet équipé ou lié est rangé à part, quelle que soit sa nature', () => {
    const rations = item({ properties: { category: 'Nourriture' } })
    expect(inventoryGroupOf(entry(rations))).toBe('consumable')
    expect(inventoryGroupOf(entry(rations, { equipped: true }))).toBe('worn')
    expect(inventoryGroupOf(entry(sword, { attuned: true }))).toBe('worn')
    expect(inventoryGroupOf(entry(sword))).toBe('bag')
    expect(inventoryStateOf(entry(sword, { equipped: true, attuned: true }))).toBe('attuned')
    expect(inventoryStateOf(entry(sword, { equipped: true }))).toBe('equipped')
    expect(inventoryStateOf(entry(sword))).toBe('stowed')
  })

  it('un objet renvoyé sans ses effets (réponse d\'un ajout) n\'est pas une erreur', () => {
    const fromPost = item({ effects: undefined as unknown as InventoryItem['effects'] })
    expect(inventoryCategoryOf(entry(fromPost))).toBe('gear')
  })
})

describe('résumés des objets', () => {
  it('dégâts, portée et CA', () => {
    expect(weaponDamageSummary(sword)).toBe('1d8 tranchant')
    expect(weaponRangeSummary(sword)).toBeNull()
    expect(weaponRangeSummary(bow)).toBe('24 m / 96 m')
    expect(armorClassSummary(shield)).toBe('+2 CA')
    expect(armorClassSummary(halfPlate)).toBe('CA 15+DEX (max +2)')
    expect(isBodyArmor(shield)).toBe(false)
    expect(isBodyArmor(halfPlate)).toBe(true)
  })
})
