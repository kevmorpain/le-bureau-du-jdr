import { isPlayableFeature, toFeatureCard, toItemCard, toSpellCard, toWeaponCard, type PlayCard } from '~/utils/playCards'
import { hasAvailableSlot, type CharacterSpellWithSpell } from './useCharacterSpells'
import type { SlotsByType } from './useCharacterSpellcasting'
import type { InventoryEntry, WeaponStats } from './useCharacterInventory'
import type { useSpellCasting } from './useSpellCasting'

type CharacterSheetApi = ReturnType<typeof useCharacterSheet>
type PlayCardsDeps = Pick<CharacterSheetApi, 'characterSpells' | 'allCharacterFeatures' | 'equippedWeaponStats' | 'inventory'> & {
  spellSlots: Ref<SlotsByType>
  spellCasting: Pick<ReturnType<typeof useSpellCasting>, 'isCastable' | 'isArcanumSpell' | 'getArcanumRemaining'>
}

type PlayFeature = CharacterSheetApi['allCharacterFeatures']['value'][number]

// Each card keeps a link to what it was projected from: the drawer and the actions need the full entity.
export type PlayCardSource
  = | { kind: 'spell', characterSpell: CharacterSpellWithSpell }
    | { kind: 'feature', feature: PlayFeature }
    | { kind: 'weapon', weapon: WeaponStats, entry: InventoryEntry | undefined }
    | { kind: 'item', entry: InventoryEntry }

export const usePlayCards = ({ characterSpells, allCharacterFeatures, equippedWeaponStats, inventory, spellSlots, spellCasting }: PlayCardsDeps) => {
  const entryById = computed(() => new Map((inventory.value ?? []).map(entry => [entry.id, entry])))

  const spellCards = computed(() => (characterSpells.value ?? [])
    .filter(spellCasting.isCastable)
    .map((characterSpell) => {
      const arcanumRemaining = spellCasting.getArcanumRemaining(characterSpell)
      const card = toSpellCard({
        spellId: characterSpell.spellId,
        isArcanum: spellCasting.isArcanumSpell(characterSpell),
        hasSlotAvailable: hasAvailableSlot(spellSlots.value, characterSpell.spell.level),
        arcanumUses: arcanumRemaining === null ? null : { max: 1, remaining: arcanumRemaining },
        spell: characterSpell.spell,
      })
      return { card, source: { kind: 'spell', characterSpell } as const }
    }))

  const featureCards = computed(() => allCharacterFeatures.value
    .map(feature => ({
      feature,
      projected: {
        id: feature.id,
        name: feature.name,
        actionType: feature.actionType ?? null,
        rechargeType: feature.rechargeType ?? null,
        maxUses: feature.maxUses ?? null,
        currentUses: feature.currentUses ?? 0,
        unlimited: 'unlimited' in feature ? feature.unlimited : false,
      },
    }))
    .filter(({ projected }) => isPlayableFeature(projected))
    .map(({ feature, projected }) => ({ card: toFeatureCard(projected), source: { kind: 'feature', feature } as const })))

  const weaponCards = computed(() => equippedWeaponStats.value.map((weapon) => {
    const entry = entryById.value.get(weapon.entryId)
    const card = toWeaponCard({
      entryId: weapon.entryId,
      name: weapon.name,
      isRanged: weapon.isRanged,
      ammunition: weapon.ammunition,
      maxUses: entry?.item?.maxUses ?? null,
      currentUses: entry?.currentUses ?? 0,
      rechargeType: entry?.item?.rechargeType ?? null,
    })
    return { card, source: { kind: 'weapon', weapon, entry } as const }
  }))

  const itemCards = computed(() => (inventory.value ?? [])
    .filter(entry => entry.item && entry.item.itemType !== 'weapon' && (entry.item.maxUses ?? 0) > 0)
    .map((entry) => {
      const card = toItemCard({
        entryId: entry.id,
        name: entry.item!.name,
        maxUses: entry.item!.maxUses!,
        currentUses: entry.currentUses,
        rechargeType: entry.item!.rechargeType,
      })
      return { card, source: { kind: 'item', entry } as const }
    }))

  const projections = computed<{ card: PlayCard, source: PlayCardSource }[]>(() => [
    ...spellCards.value,
    ...featureCards.value,
    ...weaponCards.value,
    ...itemCards.value,
  ])

  const cards = computed(() => projections.value.map(({ card }) => card))
  const sourceByKey = computed(() => new Map(projections.value.map(({ card, source }) => [card.key, source])))

  const getSource = (key: string): PlayCardSource | undefined => sourceByKey.value.get(key)

  return { cards, getSource }
}
