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
  // Effets magiques baked-in sur l'item (jointure item_effects). Toujours
  // appliqués quand l'item est équipé. Pour un objet différent, créer un nouvel
  // item custom (item_effects sont fixes une fois définis).
  effects: Effect[]
  // Charges : maxUses null = objet sans charge. rechargeDice null = recharge
  // complète ; sinon expression de dés (recharge partielle).
  maxUses: number | null
  rechargeType: 'short_rest' | 'long_rest' | 'dawn' | null
  rechargeDice: string | null
  isCustom: boolean
}

export interface InventoryEntry {
  id: number
  characterSheetId: number
  itemId: number
  quantity: number
  equipped: boolean
  magicBonus: number
  currentUses: number
  notes: string | null
  usingTwoHanded: boolean
  item: InventoryItem | null
}

export interface WeaponStats {
  entryId: number
  name: string
  attackBonus: number
  damageDice: string
  damageBonus: number
  damageBonusOffhand: number  // dégâts main secondaire (pas de mod sauf si négatif)
  damageType: string
  properties: string[]
  versatileDamage?: string
  isVersatile: boolean
  isLight: boolean
  usingTwoHanded: boolean
  warnings: string[]
  rangeText: string | null
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
  const { offlineMutate } = useOfflineMutation(() => characterId.value ?? 0)
  const { refreshPendingCount } = useOfflineSync()

  // ─── Data fetching ────────────────────────────────────────────────────────

  const { data: inventoryData, refresh: refreshInventory } = useFetch<InventoryEntry[]>(
    () => characterId.value !== undefined ? `/api/character_sheets/${characterId.value}/inventory` : null,
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
    () => characterId.value !== undefined ? `/api/character_sheets/${characterId.value}/proficiency-overrides` : null,
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
  // Les effets sont stockés sur l'item lui-même (table item_effects, exposée
  // via item.effects). Pas d'override par-instance : pour personnaliser,
  // créer un nouvel item custom.

  const inventoryEffects = computed<Effect[]>(() =>
    inventory.value
      .filter(e => e.equipped)
      .flatMap(e => e.item?.effects ?? []),
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

  const speciesSize = computed(() => characterSheet?.value?.species?.size ?? null)

  const equippedWeaponStats = computed<WeaponStats[]>(() =>
    equippedWeapons.value
      .filter(e => e.item)
      .map((entry) => {
        const item = entry.item!
        const props = item.properties as WeaponProperties
        const propList = props.weapon_properties
        const isFinesse = propList.includes('finesse')
        const isLight = propList.includes('light')
        const isHeavy = propList.includes('heavy')
        const isTwoHanded = propList.includes('two_handed')
        const isLoading = propList.includes('loading')
        const isVersatile = propList.includes('versatile')
        const isThrown = propList.includes('thrown')
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
        // Dégâts main secondaire : pas de modificateur sauf s'il est négatif (règle PHB)
        const offhandMod = abilityMod < 0 ? abilityMod : 0
        const damageBonusOffhand = offhandMod + (entry.magicBonus ?? 0)

        const damageDice = isVersatile && entry.usingTwoHanded
          ? props.versatile_damage ?? props.damage_dice
          : props.damage_dice

        const warnings: string[] = []
        if (isHeavy && (speciesSize.value === 'P' || speciesSize.value === 'TP')) {
          warnings.push('Désavantage : arme lourde + Petite taille')
        }
        if (isTwoHanded && equippedShield.value) {
          warnings.push('Impossible d\'utiliser cette arme avec un bouclier équipé')
        }
        if (isLoading) {
          warnings.push('Une attaque par action quel que soit le nombre d\'attaques disponibles')
        }

        let rangeText: string | null = null
        if (props.range && (isRanged || isThrown)) {
          rangeText = `${props.range.normal} m / ${props.range.long} m`
        }

        return {
          entryId: entry.id,
          name: item.name,
          attackBonus,
          damageDice,
          damageBonus,
          damageBonusOffhand,
          damageType: props.damage_type,
          properties: propList,
          versatileDamage: props.versatile_damage,
          isVersatile,
          isLight,
          usingTwoHanded: entry.usingTwoHanded ?? false,
          warnings,
          rangeText,
          magicBonus: entry.magicBonus ?? 0,
          isProficient: proficient,
        }
      }),
  )

  // ─── Mutations ────────────────────────────────────────────────────────────

  // Toutes les mutations sont optimistes (mise à jour locale immédiate) puis routées via la
  // file hors-ligne. On supprime les `refresh()` qui échouaient hors-ligne ; la réconciliation
  // post-synchro (signal `lastSynced` → re-fetch dans la page) récupère l'état serveur canonique.

  const addItem = async (itemId: number, options: {
    quantity?: number
    equipped?: boolean
    magicBonus?: number
    notes?: string
    // Détails de l'objet pour l'affichage optimiste hors-ligne (l'appelant les a déjà).
    item?: InventoryItem
  } = {}) => {
    if (!characterId.value) return
    const { item: optimisticItem, quantity = 1, equipped = false, magicBonus = 0, notes } = options

    // Insertion optimiste avec id temporaire négatif (pas de collision avec les ids serveur).
    const tempId = -Date.now()
    inventoryData.value = [...(inventoryData.value ?? []), {
      id: tempId,
      characterSheetId: characterId.value,
      itemId,
      quantity,
      equipped,
      magicBonus,
      currentUses: 0,
      notes: notes ?? null,
      usingTwoHanded: false,
      item: optimisticItem ?? null,
    }]

    await offlineMutate({
      endpoint: `/api/character_sheets/${characterId.value}/inventory`,
      method: 'POST',
      body: { itemId, quantity, equipped, magicBonus, ...(notes !== undefined ? { notes } : {}) },
      // dedupeKey unique par ajout : permet d'annuler l'ajout si l'objet est retiré avant synchro.
      dedupeKey: `inv-new:${tempId}`,
      label: 'Objet ajouté',
      onServerResponse: (res) => {
        inventoryData.value = (inventoryData.value ?? []).map(e => e.id === tempId ? (res as InventoryEntry) : e)
      },
    })
  }

  const removeItem = async (entryId: number) => {
    if (!characterId.value) return
    inventoryData.value = (inventoryData.value ?? []).filter(e => e.id !== entryId)

    // Objet ajouté hors-ligne puis retiré avant toute synchro : on annule l'ajout en file
    // (sinon il réapparaîtrait à la reconnexion).
    if (entryId < 0) {
      writeQueue(characterId.value, readQueue(characterId.value).filter(o => o.dedupeKey !== `inv-new:${entryId}`))
      refreshPendingCount()
      return
    }

    await offlineMutate({
      endpoint: `/api/character_sheets/${characterId.value}/inventory/${entryId}`,
      method: 'DELETE',
      dedupeKey: `inv:${entryId}`,
      label: 'Objet retiré',
    })
  }

  const updateEntry = async (entryId: number, updates: {
    quantity?: number
    equipped?: boolean
    magicBonus?: number
    currentUses?: number
    notes?: string
    usingTwoHanded?: boolean
  }) => {
    if (!characterId.value) return
    inventoryData.value = (inventoryData.value ?? []).map(e =>
      e.id === entryId ? { ...e, ...updates } : e,
    )

    // Entrée pas encore synchronisée (id temporaire) : la modif part avec le POST au refresh.
    if (entryId < 0) return

    await offlineMutate({
      endpoint: `/api/character_sheets/${characterId.value}/inventory/${entryId}`,
      method: 'PUT',
      body: updates,
      // La ligne est keyée par id : la dernière action (update/delete) sur l'entrée gagne.
      dedupeKey: `inv:${entryId}`,
      label: 'Inventaire',
    })
  }

  const toggleEquipped = (entryId: number) => {
    const entry = inventory.value.find(e => e.id === entryId)
    if (!entry) return
    return updateEntry(entryId, { equipped: !entry.equipped })
  }

  const setUsingTwoHanded = async (entryId: number, value: boolean) => {
    await updateEntry(entryId, { usingTwoHanded: value })
  }

  const addProficiencyOverride = async (proficiencyType: 'weapon' | 'armor' | 'language' | 'tool', value: string, action: 'grant' | 'revoke') => {
    if (!characterId.value) return
    if (proficiencyType === 'weapon' || proficiencyType === 'armor') {
      proficiencyOverridesData.value = [
        ...(proficiencyOverridesData.value ?? []).filter(o => !(o.proficiencyType === proficiencyType && o.value === value)),
        { characterSheetId: characterId.value, proficiencyType, value, action },
      ]
    }

    await offlineMutate({
      endpoint: `/api/character_sheets/${characterId.value}/proficiency-overrides`,
      method: 'PUT',
      body: { proficiencyType, value, action },
      dedupeKey: `prof:${proficiencyType}:${value}`,
      label: 'Maîtrises',
    })
  }

  const removeProficiencyOverride = async (proficiencyType: 'weapon' | 'armor' | 'language' | 'tool', value: string) => {
    if (!characterId.value) return
    proficiencyOverridesData.value = (proficiencyOverridesData.value ?? []).filter(
      o => !(o.proficiencyType === proficiencyType && o.value === value),
    )

    await offlineMutate({
      endpoint: `/api/character_sheets/${characterId.value}/proficiency-overrides`,
      method: 'DELETE',
      body: { proficiencyType, value },
      dedupeKey: `prof:${proficiencyType}:${value}`,
      label: 'Maîtrises',
    })
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
    setUsingTwoHanded,
    addProficiencyOverride,
    removeProficiencyOverride,
    refreshInventory,
  }
}
