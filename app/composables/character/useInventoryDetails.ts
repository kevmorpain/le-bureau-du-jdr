import type { ArmorProperties, WeaponProperties } from '~~/server/db/schema/items'
import { RARITY_LABELS_FR } from '~~/shared/rules/itemRarity'
import { weaponPropertyLabels } from '~~/shared/utils/item'
import { toItemCard, toWeaponCard, type PlayCard } from '~/utils/playCards'
import { armorClassSummary, itemKindLabel, weaponDamageSummary, weaponRangeSummary } from '~/utils/inventoryView'
import type { InventoryEntry } from './useCharacterInventory'
import { usePlayCardDetails, type PlayDetail } from './usePlayCardDetails'

type InventoryDetailsDeps = Parameters<typeof usePlayCardDetails>[0] & Pick<ReturnType<typeof useCharacterSheet>, 'equippedWeaponStats'>

// The play drawer shows an inventory entry too: an equipped weapon with its combat figures, an item with its charges.
export const useInventoryDetails = (deps: InventoryDetailsDeps) => {
  const { t } = useI18n()
  const { getDetail } = usePlayCardDetails(deps)
  const weaponByEntry = computed(() => new Map(deps.equippedWeaponStats.value.map(weapon => [weapon.entryId, weapon])))

  const getCard = (entry: InventoryEntry): PlayCard => {
    const item = entry.item!
    const weapon = weaponByEntry.value.get(entry.id)
    const charges = { maxUses: item.maxUses ?? 0, currentUses: entry.currentUses, rechargeType: item.rechargeType }
    if (weapon) return toWeaponCard({ entryId: entry.id, name: item.name, isRanged: weapon.isRanged, ammunition: weapon.ammunition, ...charges })
    const card = toItemCard({ entryId: entry.id, name: item.name, ...charges })
    return item.itemType === 'weapon' ? { ...card, kind: 'weapon' } : card
  }

  const getOwnTiles = (entry: InventoryEntry): PlayDetail['tiles'] => {
    const item = entry.item!
    if (item.itemType === 'weapon') {
      const range = weaponRangeSummary(item)
      return [
        { label: t('sheet.play.tiles.damage'), value: weaponDamageSummary(item), damageType: (item.properties as WeaponProperties).damage_type },
        ...(range ? [{ label: t('sheet.play.tiles.range'), value: range }] : []),
      ]
    }
    if (item.itemType === 'armor') {
      const { stealth_disadvantage: hasStealthDisadvantage } = item.properties as ArmorProperties
      return [
        { label: t('sheet.inventory.tiles.armor_class'), value: armorClassSummary(item) },
        { label: t('sheet.inventory.tiles.stealth'), value: hasStealthDisadvantage ? t('sheet.inventory.stealth_disadvantage') : t('sheet.inventory.stealth_ok') },
      ]
    }
    return []
  }

  const getInventoryDetail = (entry: InventoryEntry, card: PlayCard): PlayDetail => {
    const item = entry.item!
    const weapon = weaponByEntry.value.get(entry.id)
    const badges = [
      ...(item.rarity ? [RARITY_LABELS_FR[item.rarity]] : []),
      ...(entry.magicBonus > 0 ? [`+${entry.magicBonus}`] : []),
      ...(item.requiresAttunement ? [t('sheet.inventory.attunement')] : []),
    ]
    if (weapon) return { ...getDetail(card, { kind: 'weapon', weapon, entry }), badges }
    const base = getDetail(card, { kind: 'item', entry })
    return {
      ...base,
      typeLabel: t(`sheet.inventory.types.${item.itemType}`),
      subtitle: itemKindLabel(item),
      badges,
      tiles: [...getOwnTiles(entry), ...base.tiles],
      properties: item.itemType === 'weapon'
        ? (item.properties as WeaponProperties).weapon_properties.map(property => weaponPropertyLabels[property] ?? property)
        : [],
    }
  }

  return { getCard, getInventoryDetail }
}
