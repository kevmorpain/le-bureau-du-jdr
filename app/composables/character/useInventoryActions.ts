import type { InventoryEntry } from './useCharacterInventory'
import { isBodyArmor } from '~/utils/inventoryView'

type InventoryApi = Pick<ReturnType<typeof useCharacterSheet>, 'inventory' | 'updateInventoryEntry' | 'toggleEquipped'>

export const useInventoryActions = ({ inventory, updateInventoryEntry, toggleEquipped }: InventoryApi) => {
  // Only one body armor is worn at a time: donning one takes the other off.
  const toggleEquippedEntry = async (entry: InventoryEntry) => {
    if (!entry.equipped && isBodyArmor(entry.item)) {
      const worn = (inventory.value ?? []).find(other => other.equipped && other.id !== entry.id && isBodyArmor(other.item))
      if (worn) await updateInventoryEntry(worn.id, { equipped: false })
    }
    await toggleEquipped(entry.id)
  }

  const setQuantity = (entry: InventoryEntry, quantity: number) =>
    updateInventoryEntry(entry.id, { quantity: Math.max(1, Math.round(quantity)) })

  const setCharges = (entry: InventoryEntry, spent: number) =>
    updateInventoryEntry(entry.id, { currentUses: Math.max(0, Math.min(entry.item?.maxUses ?? 0, spent)) })

  return { toggleEquippedEntry, setQuantity, setCharges }
}
