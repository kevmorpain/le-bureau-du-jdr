import type { Effect } from '~~/server/db/schema/effects'
import type {
  WeaponProperties,
  ArmorProperties,
  ToolProperties,
} from '~~/server/db/schema/items'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InventoryItem {
  id: number
  name: string
  itemType: 'weapon' | 'armor' | 'equipment' | 'tool'
  properties: WeaponProperties | ArmorProperties | { category: string } | ToolProperties
  description: string | null
  isCustom: boolean
}

export interface InventoryEntry {
  id: number
  characterSheetId: number
  itemId: number
  quantity: number
  equipped: boolean
  magicBonus: number
  magicEffects: Effect[] | null
  notes: string | null
  item: InventoryItem | null
}

export interface WeaponStats {
  entryId: number
  name: string
  attackBonus: number
  damageDice: string
  damageBonus: number
  damageType: string
  properties: string[]
  versatileDamage?: string
  magicBonus: number
  isProficient: boolean
}

export interface ArmorClassBreakdown {
  total: number
  detail: string
  armorName?: string
  hasShield: boolean
}

// ─── Composable ──────────────────────────────────────────────────────────────

export const useCharacterInventory = (
  characterSheet?: Ref<CharacterSheet>,
  deps?: {
    allEffects: ComputedRef<Effect[]>
    abilityModifiers: ComputedRef<Record<string, number>>
    proficiencyBonus: ComputedRef<number>
    spellcastingAbility: ComputedRef<string | null>
  },
) => {
  const characterId = computed(() => characterSheet?.value?.id)

  // ─── Data fetching ────────────────────────────────────────────────────────

  const { data: inventoryData, refresh: refreshInventory } = useFetch<InventoryEntry[]>(
    () => `/api/character_sheets/${characterId.value}/inventory`,
    {
      watch: [characterId],
      default: () => [],
    },
  )

  const { data: proficiencyOverridesData, refresh: refreshProficiencyOverrides } = useFetch<Array<{
    characterSheetId: number
    proficiencyType: 'weapon' | 'armor'
    value: string
    action: 'grant' | 'revoke'
  }>>(
    () => `/api/character_sheets/${characterId.value}/proficiency-overrides`,
    {
      watch: [characterId],
      default: () => [],
    },
  )

  const inventory = computed<InventoryEntry[]>(() => inventoryData.value ?? [])
  const proficiencyOverrides = computed(() => proficiencyOverridesData.value ?? [])

  // ─── Equipped items ───────────────────────────────────────────────────────

  const equippedWeapons = computed(() =>
    inventory.value.filter(e => e.equipped && e.item?.itemType === 'weapon'),
  )

  const equippedBodyArmor = computed(() =>
    inventory.value.find(e => {
      if (!e.equipped || e.item?.itemType !== 'armor') return false
      const props = e.item.properties as ArmorProperties
      return props.armor_type !== 'shield'
    }) ?? null,
  )

  const equippedShield = computed(() =>
    inventory.value.find(e => {
      if (!e.equipped || e.item?.itemType !== 'armor') return false
      const props = e.item.properties as ArmorProperties
      return props.armor_type === 'shield'
    }) ?? null,
  )

  // ─── Magic item effects → merged into allEffects upstream ─────────────────

  const inventoryEffects = computed<Effect[]>(() =>
    inventory.value
      .filter(e => e.equipped && e.magicEffects?.length)
      .flatMap(e => e.magicEffects as Effect[]),
  )

  // ─── Proficiencies ────────────────────────────────────────────────────────

  const weaponProficiencies = computed<string[]>(() => {
    const fromEffects = (deps?.allEffects.value ?? [])
      .filter(e => e.type === 'weapon_proficiency')
      .map(e => e.value as string)

    const grantedOverrides = proficiencyOverrides.value
      .filter(o => o.proficiencyType === 'weapon' && o.action === 'grant')
      .map(o => o.value)

    const revokedOverrides = new Set(
      proficiencyOverrides.value
        .filter(o => o.proficiencyType === 'weapon' && o.action === 'revoke')
        .map(o => o.value),
    )

    return [...new Set([...fromEffects, ...grantedOverrides])].filter(p => !revokedOverrides.has(p))
  })

  const armorProficiencies = computed<string[]>(() => {
    const fromEffects = (deps?.allEffects.value ?? [])
      .filter(e => e.type === 'proficiency')
      .map(e => e.value as string)
      .filter(v => ['light', 'medium', 'heavy', 'shield', 'all_armor'].some(a => v.includes(a) || v === a))

    const grantedOverrides = proficiencyOverrides.value
      .filter(o => o.proficiencyType === 'armor' && o.action === 'grant')
      .map(o => o.value)

    const revokedOverrides = new Set(
      proficiencyOverrides.value
        .filter(o => o.proficiencyType === 'armor' && o.action === 'revoke')
        .map(o => o.value),
    )

    return [...new Set([...fromEffects, ...grantedOverrides])].filter(p => !revokedOverrides.has(p))
  })

  const isWeaponProficient = (item: InventoryItem): boolean => {
    const props = item.properties as WeaponProperties
    const cat = props.weapon_category
    return weaponProficiencies.value.some(p =>
      p === cat
      || (p === 'simple_weapons' && cat.startsWith('simple'))
      || (p === 'martial_weapons' && cat.startsWith('martial'))
      || p.toLowerCase() === item.name.toLowerCase(),
    )
  }

  const isArmorProficient = (item: InventoryItem): boolean => {
    const props = item.properties as ArmorProperties
    const type = props.armor_type
    return armorProficiencies.value.some(p =>
      p === type || p === 'all_armor',
    )
  }

  // ─── Armor class ──────────────────────────────────────────────────────────

  const computedAC = computed<ArmorClassBreakdown>(() => {
    const dexMod = deps?.abilityModifiers.value.dex ?? 0
    const shieldBonus = equippedShield.value ? 2 + (equippedShield.value.magicBonus ?? 0) : 0

    if (!equippedBodyArmor.value) {
      const base = 10 + dexMod
      const total = base + shieldBonus
      return {
        total,
        detail: `10 + DEX ${dexMod >= 0 ? '+' : ''}${dexMod}${shieldBonus ? ` + bouclier +${shieldBonus}` : ''}`,
        hasShield: !!equippedShield.value,
      }
    }

    const armor = equippedBodyArmor.value
    const props = armor.item!.properties as ArmorProperties
    const magicAC = armor.magicBonus ?? 0
    let acFromArmor = props.base_ac + magicAC

    let dexContrib = 0
    let dexDetail = ''

    if (props.dex_limit === null) {
      dexContrib = dexMod
      dexDetail = dexMod >= 0 ? ` + DEX +${dexMod}` : ` + DEX ${dexMod}`
    } else if (props.dex_limit > 0) {
      dexContrib = Math.min(dexMod, props.dex_limit)
      dexDetail = ` + DEX ${dexContrib >= 0 ? '+' : ''}${dexContrib} (max +${props.dex_limit})`
    }

    acFromArmor += dexContrib

    const total = acFromArmor + shieldBonus
    const shieldDetail = shieldBonus ? ` + bouclier +${shieldBonus}` : ''
    const magicDetail = magicAC > 0 ? ` +${magicAC}` : ''

    return {
      total,
      detail: `${armor.item!.name} ${props.base_ac}${magicDetail}${dexDetail}${shieldDetail}`,
      armorName: armor.item!.name,
      hasShield: !!equippedShield.value,
    }
  })

  // ─── Armor penalties ──────────────────────────────────────────────────────

  const equippedArmorProficiencyWarning = computed<string | null>(() => {
    const armor = equippedBodyArmor.value
    if (!armor || !armor.item) return null
    if (isArmorProficient(armor.item)) return null

    const type = (armor.item.properties as ArmorProperties).armor_type
    const typeLabel = { light: 'légère', medium: 'intermédiaire', heavy: 'lourde', shield: 'bouclier' }[type] ?? type
    return `Armure ${typeLabel} non maîtrisée`
  })

  const armorNonProficiencyDisadvantage = computed<string | null>(() => {
    if (!equippedArmorProficiencyWarning.value) return null
    return 'Armure non maîtrisée : désavantage aux jets d\'attaque et de Force/Dextérité'
  })

  const armorSpellcastingWarning = computed<string | null>(() => {
    if (!equippedArmorProficiencyWarning.value) return null
    if (!deps?.spellcastingAbility.value) return null
    return 'Armure non maîtrisée : impossible de lancer des sorts'
  })

  const armorStealthDisadvantage = computed<boolean>(() => {
    const armor = equippedBodyArmor.value
    if (!armor?.item) return false
    return (armor.item.properties as ArmorProperties).stealth_disadvantage === true
  })

  // ─── Weapon combat stats ──────────────────────────────────────────────────

  const equippedWeaponStats = computed<WeaponStats[]>(() =>
    equippedWeapons.value
      .filter(e => e.item)
      .map((entry) => {
        const item = entry.item!
        const props = item.properties as WeaponProperties
        const isFinesse = props.weapon_properties.includes('finesse')
        const isRanged = props.weapon_category.endsWith('ranged')
        const strMod = deps?.abilityModifiers.value.str ?? 0
        const dexMod = deps?.abilityModifiers.value.dex ?? 0
        const profBonus = deps?.proficiencyBonus.value ?? 2
        const proficient = isWeaponProficient(item)

        const abilityMod = isFinesse
          ? Math.max(strMod, dexMod)
          : isRanged ? dexMod : strMod

        const attackBonus = abilityMod + (proficient ? profBonus : 0) + (entry.magicBonus ?? 0)
        const damageBonus = abilityMod + (entry.magicBonus ?? 0)

        return {
          entryId: entry.id,
          name: item.name,
          attackBonus,
          damageDice: props.damage_dice,
          damageBonus,
          damageType: props.damage_type,
          properties: props.weapon_properties,
          versatileDamage: props.versatile_damage,
          magicBonus: entry.magicBonus ?? 0,
          isProficient: proficient,
        }
      }),
  )

  // ─── Mutations ────────────────────────────────────────────────────────────

  const addItem = async (itemId: number, options: {
    quantity?: number
    equipped?: boolean
    magicBonus?: number
    magicEffects?: Effect[]
    notes?: string
  } = {}) => {
    if (!characterId.value) return

    await $fetch(`/api/character_sheets/${characterId.value}/inventory`, {
      method: 'POST',
      body: { itemId, quantity: 1, equipped: false, magicBonus: 0, ...options },
    })

    await refreshInventory()
  }

  const removeItem = async (entryId: number) => {
    if (!characterId.value) return

    await $fetch(`/api/character_sheets/${characterId.value}/inventory/${entryId}`, {
      method: 'DELETE',
    })

    await refreshInventory()
  }

  const updateEntry = async (entryId: number, updates: {
    quantity?: number
    equipped?: boolean
    magicBonus?: number
    magicEffects?: Effect[]
    notes?: string
  }) => {
    if (!characterId.value) return

    await $fetch(`/api/character_sheets/${characterId.value}/inventory/${entryId}`, {
      method: 'PUT',
      body: updates,
    })

    await refreshInventory()
  }

  const toggleEquipped = (entryId: number) => {
    const entry = inventory.value.find(e => e.id === entryId)
    if (!entry) return
    return updateEntry(entryId, { equipped: !entry.equipped })
  }

  const addProficiencyOverride = async (proficiencyType: 'weapon' | 'armor' | 'language' | 'tool', value: string, action: 'grant' | 'revoke') => {
    if (!characterId.value) return

    await $fetch(`/api/character_sheets/${characterId.value}/proficiency-overrides`, {
      method: 'PUT',
      body: { proficiencyType, value, action },
    })

    await refreshProficiencyOverrides()
  }

  const removeProficiencyOverride = async (proficiencyType: 'weapon' | 'armor' | 'language' | 'tool', value: string) => {
    if (!characterId.value) return

    await $fetch(`/api/character_sheets/${characterId.value}/proficiency-overrides`, {
      method: 'DELETE',
      body: { proficiencyType, value },
    })

    await refreshProficiencyOverrides()
  }

  return {
    inventory,
    proficiencyOverrides,
    equippedWeapons,
    equippedBodyArmor,
    equippedShield,
    inventoryEffects,
    weaponProficiencies,
    armorProficiencies,
    isWeaponProficient,
    isArmorProficient,
    computedAC,
    equippedArmorProficiencyWarning,
    armorNonProficiencyDisadvantage,
    armorSpellcastingWarning,
    armorStealthDisadvantage,
    equippedWeaponStats,
    addItem,
    removeItem,
    updateEntry,
    toggleEquipped,
    addProficiencyOverride,
    removeProficiencyOverride,
    refreshInventory,
  }
}
