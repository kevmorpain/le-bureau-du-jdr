import { useStorage } from '@vueuse/core'
import { evaluate } from '~~/shared/utils/formula'
import type { FormulaContext } from '~~/shared/utils/formula'
import type { Effect } from '~~/server/db/schema/effects'
import { useCharacterClasses } from './character/useCharacterClasses'
import { useCharacterAbilities } from './character/useCharacterAbilities'
import { useCharacterConditions, binaryConditions } from './character/useCharacterConditions'
import { useCharacterSpellcasting } from './character/useCharacterSpellcasting'
import { useCharacterSpells } from './character/useCharacterSpells'
import { useCharacterInventory } from './character/useCharacterInventory'
import { useCharacterBackground } from './character/useCharacterBackground'

export const useCharacterSheet = (characterSheet?: Ref<CharacterSheet>) => {
  // ─── Couche 1 : classes, espèce ───────────────────────────────────────────

  const classes = useCharacterClasses(characterSheet)

  // ─── Features brutes (sans formule, pour filtrage par niveau) ──────────────
  // On extrait les métadonnées (featureType, classId, subclassId, levelRequired, effects)
  // pour pouvoir filtrer les effets ASI avant useCharacterAbilities, sans dépendre
  // de formulaContext (qui dépend de abilities).

  const rawFeatures = computed(() =>
    (characterSheet?.value?.features ?? []).map((cf) => {
      const feature = cf.feature!
      return {
        id: feature.id,
        name: feature.name,
        featureType: feature.featureType,
        classId: feature.classId,
        subclassId: feature.subclassId,
        levelRequired: feature.levelRequired,
        effects: (feature.featureEffects?.map(fe => fe.effect).filter(Boolean) ?? []) as Effect[],
      }
    }),
  )

  const unlockedFeatureEffects = computed<Effect[]>(() => {
    const ccs = classes.characterClasses.value
    return rawFeatures.value.flatMap((f) => {
      if (f.featureType === 'species_trait') return f.effects
      const lvlReq = f.levelRequired ?? 1
      const owner = f.featureType === 'class_feature'
        ? ccs.find(c => c.classId === f.classId)
        : ccs.find(c => c.subclass?.id === f.subclassId)
      return owner && owner.level >= lvlReq ? f.effects : []
    })
  })

  const asiEffects = computed<Effect[]>(() => {
    const ccs = classes.characterClasses.value
    return (characterSheet?.value?.abilityScoreImprovements ?? [])
      .filter((asi) => {
        const c = ccs.find(cc => cc.classId === asi.classId)
        return c && c.level >= asi.classLevel
      })
      .map(asi => ({
        type: 'ability_increase' as const,
        value: { ability: asi.ability, amount: asi.amount },
      }))
  })

  // ─── Couche 2 : scores de caractéristiques ────────────────────────────────

  const abilities = useCharacterAbilities(characterSheet, {
    speciesEffects: classes.speciesEffects,
    featureEffects: unlockedFeatureEffects,
    asiEffects,
    proficiencyBonus: classes.proficiencyBonus,
  })

  // ─── Contexte de formule + features résolues (besoin des deux couches précédentes) ─

  const formulaContext = computed<FormulaContext>(() => ({
    level: classes.characterLevel.value,
    class_level: classes.mainClass.value?.level ?? classes.characterLevel.value,
    prof_bonus: classes.proficiencyBonus.value,
    str_mod: abilities.abilityModifiers.value.str ?? 0,
    dex_mod: abilities.abilityModifiers.value.dex ?? 0,
    con_mod: abilities.abilityModifiers.value.con ?? 0,
    int_mod: abilities.abilityModifiers.value.int ?? 0,
    wis_mod: abilities.abilityModifiers.value.wis ?? 0,
    cha_mod: abilities.abilityModifiers.value.cha ?? 0,
  }))

  const resolvedFeatures = computed(() =>
    (characterSheet?.value?.features ?? []).map((cf) => {
      const feature = cf.feature!
      const maxUses = feature.maxUsesFormula
        ? evaluate(feature.maxUsesFormula, formulaContext.value)
        : null
      return {
        ...feature,
        currentUses: cf.currentUses,
        maxUses,
        effects: feature.featureEffects?.map(fe => fe.effect).filter(Boolean) ?? [],
      }
    }),
  )

  const classFeatureEffects = computed<Effect[]>(() =>
    resolvedFeatures.value.flatMap(f => f.effects as Effect[]),
  )

  // ─── Liste unifiée des capacités (espèce + classe + sous-classe) ──────────

  const allCharacterFeatures = computed(() => {
    const ccs = classes.characterClasses.value
    const speciesName = classes.species.value?.name ?? 'Espèce'

    const speciesItems = classes.speciesTraits.value.map(f => ({
      ...f,
      currentUses: 0,
      maxUses: null as number | null,
      effects: (f.featureEffects?.map(fe => fe.effect).filter(Boolean) ?? []) as Effect[],
      origin: { kind: 'species' as const, label: speciesName },
    }))

    const classItems = resolvedFeatures.value.map((f) => {
      let label = ''
      let kind: 'class' | 'subclass' = 'class'
      if (f.featureType === 'class_feature') {
        label = ccs.find(c => c.classId === f.classId)?.class?.name ?? ''
      }
      else if (f.featureType === 'subclass_feature') {
        kind = 'subclass'
        label = ccs.find(c => c.subclass?.id === f.subclassId)?.subclass?.name ?? ''
      }
      return { ...f, origin: { kind, label } }
    })

    return [...speciesItems, ...classItems]
  })

  // Effets de base (espèce + features de classe) — sans les objets magiques
  const baseAllEffects = computed<Effect[]>(() => [
    ...classes.speciesEffects.value,
    ...classFeatureEffects.value,
  ])

  // ─── Couche 4 : incantation ───────────────────────────────────────────────
  // (avant conditions pour passer spellcastingAbility à l'inventaire)

  // Classe lanceuse active (persistance localStorage par perso)
  const selectedCasterClassId = useStorage<number | null>(
    characterStorageKey(characterSheet?.value?.id, 'selectedCasterClassId'),
    null,
  )
  const setSelectedCaster = (classId: number | null) => {
    selectedCasterClassId.value = classId
  }

  const spellcasting = useCharacterSpellcasting(characterSheet, {
    proficiencyBonus: classes.proficiencyBonus,
    abilityModifiers: abilities.abilityModifiers,
    resolvedFeatures,
    formulaContext,
    selectedCasterClassId,
  })

  const spells = useCharacterSpells(characterSheet, {
    spellSlots: spellcasting.spellSlots,
  })

  // ─── Couche 5 : inventaire, équipement, combat ───────────────────────────

  const inventoryLayer = useCharacterInventory(characterSheet, {
    allEffects: baseAllEffects,
    abilityModifiers: abilities.abilityModifiers,
    proficiencyBonus: classes.proficiencyBonus,
    spellcastingAbility: spellcasting.spellcastingAbility,
  })

  // allEffects complets (base + effets des objets magiques équipés)
  const allEffects = computed<Effect[]>(() => [
    ...baseAllEffects.value,
    ...inventoryLayer.inventoryEffects.value,
  ])

  // ─── Maîtrises de langues et outils ──────────────────────────────────────
  // Calculées ici car elles dépendent de allEffects (tous les effets) et des overrides,
  // mais n'ont aucune interaction avec les items d'inventaire.

  const languageProficiencies = computed<string[]>(() => {
    const fromEffects = allEffects.value
      .filter(e => e.type === 'language_proficiency')
      .map(e => e.value as string)
    const overrides = inventoryLayer.proficiencyOverrides.value
    const grants = overrides
      .filter(o => o.proficiencyType === 'language' && o.action === 'grant')
      .map(o => o.value)
    const revokes = new Set(overrides
      .filter(o => o.proficiencyType === 'language' && o.action === 'revoke')
      .map(o => o.value))
    return [...new Set([...fromEffects, ...grants])].filter(p => !revokes.has(p))
  })

  const toolProficiencies = computed<string[]>(() => {
    const fromEffects = allEffects.value
      .filter(e => e.type === 'tool_proficiency')
      .map(e => e.value as string)
    const overrides = inventoryLayer.proficiencyOverrides.value
    const grants = overrides
      .filter(o => o.proficiencyType === 'tool' && o.action === 'grant')
      .map(o => o.value)
    const revokes = new Set(overrides
      .filter(o => o.proficiencyType === 'tool' && o.action === 'revoke')
      .map(o => o.value))
    return [...new Set([...fromEffects, ...grants])].filter(p => !revokes.has(p))
  })

  // ─── Historique & description ─────────────────────────────────────────────

  const background = useCharacterBackground(characterSheet)

  // ─── Couche 3 : conditions, états, défenses ───────────────────────────────

  const conditions = useCharacterConditions(characterSheet, {
    allEffects,
    speed: classes.speed,
    abilityModifiers: abilities.abilityModifiers,
  })

  // ─── Sort en concentration (résolu via characterSpells) ──────────────────

  const concentratingSpell = computed(() => {
    const id = conditions.concentratingSpellId.value
    if (id === null) return null
    return spells.characterSpells.value?.find(cs => cs.spellId === id)?.spell ?? null
  })

  // ─── API publique ─────────────────────────────────────────────────────────

  return {
    // Classes & espèce
    species: classes.species,
    speed: classes.speed,
    speciesTraits: classes.speciesTraits,
    speciesEffects: classes.speciesEffects,
    characterLevel: classes.characterLevel,
    mainClass: classes.mainClass,
    multiClass: classes.multiClass,
    hitDice: classes.hitDice,
    proficiencyBonus: classes.proficiencyBonus,
    armorClass: inventoryLayer.computedAC,
    deathSavingThrows: classes.deathSavingThrows,
    // Features & effets
    resolvedFeatures,
    allCharacterFeatures,
    allEffects,
    // Caractéristiques
    abilityScores: abilities.abilityScores,
    abilityModifiers: abilities.abilityModifiers,
    abilitySkillKeys: abilities.abilitySkillKeys,
    abilityScoreBonuses: abilities.abilityScoreBonuses,
    getEffectiveProficiency: abilities.getEffectiveProficiency,
    getSkillModifier: abilities.getSkillModifier,
    savingThrows: abilities.savingThrows,
    passivePerception: abilities.passivePerception,
    initiativeBonus: abilities.initiativeBonus,
    // Conditions & états
    binaryConditions,
    activeConditions: conditions.activeConditions,
    toggleCondition: conditions.toggleCondition,
    concentratingSpellId: conditions.concentratingSpellId,
    isConcentrating: conditions.isConcentrating,
    setConcentration: conditions.setConcentration,
    concentratingSpell,
    exhaustionLevel: conditions.exhaustionLevel,
    exhaustionTooltip: conditions.exhaustionTooltip,
    hasDraconicAncestry: conditions.hasDraconicAncestry,
    dragonbornAncestry: conditions.dragonbornAncestry,
    defenseEntries: conditions.defenseEntries,
    effectiveSpeed: conditions.effectiveSpeed,
    speedModifiers: conditions.speedModifiers,
    effectiveMaxHp: conditions.effectiveMaxHp,
    skillDisadvantageReasons: conditions.skillDisadvantageReasons,
    saveStatuses: conditions.saveStatuses,
    // Incantation
    spellcastingAbility: spellcasting.spellcastingAbility,
    spellcastingModifier: spellcasting.spellcastingModifier,
    spellAttackModifier: spellcasting.spellAttackModifier,
    spellSaveDC: spellcasting.spellSaveDC,
    spellcastingStats: spellcasting.spellcastingStats,
    pactMagicStats: spellcasting.pactMagicStats,
    pactMagicAbility: spellcasting.pactMagicAbility,
    spellcasterClasses: spellcasting.spellcasterClasses,
    activeCasterClass: spellcasting.activeCasterClass,
    selectedCasterClassId,
    setSelectedCaster,
    spellSlots: spellcasting.spellSlots,
    availableSpellSlots: spellcasting.availableSpellSlots,
    // ─── Sorts du personnage ──────────────────────────────────────────────────
    characterSpells: spells.characterSpells,
    spellsByLevel: spells.spellsByLevel,
    showPreparedOnly: spells.showPreparedOnly,
    showAvailableOnly: spells.showAvailableOnly,
    isSpellAvailable: spells.isSpellAvailable,
    togglePrepared: spells.togglePrepared,
    addSpell: spells.addSpell,
    removeSpell: spells.removeSpell,
    castSpell: spells.castSpell,
    refreshSpells: spells.refreshSpells,
    // Inventaire & combat
    inventory: inventoryLayer.inventory,
    proficiencyOverrides: inventoryLayer.proficiencyOverrides,
    equippedWeaponStats: inventoryLayer.equippedWeaponStats,
    equippedBodyArmor: inventoryLayer.equippedBodyArmor,
    equippedShield: inventoryLayer.equippedShield,
    weaponProficiencies: inventoryLayer.weaponProficiencies,
    armorProficiencies: inventoryLayer.armorProficiencies,
    languageProficiencies,
    toolProficiencies,
    isWeaponProficient: inventoryLayer.isWeaponProficient,
    isArmorProficient: inventoryLayer.isArmorProficient,
    equippedArmorProficiencyWarning: inventoryLayer.equippedArmorProficiencyWarning,
    armorNonProficiencyDisadvantage: inventoryLayer.armorNonProficiencyDisadvantage,
    armorSpellcastingWarning: inventoryLayer.armorSpellcastingWarning,
    armorStealthDisadvantage: inventoryLayer.armorStealthDisadvantage,
    addItem: inventoryLayer.addItem,
    removeItem: inventoryLayer.removeItem,
    updateInventoryEntry: inventoryLayer.updateEntry,
    toggleEquipped: inventoryLayer.toggleEquipped,
    setUsingTwoHanded: inventoryLayer.setUsingTwoHanded,
    addProficiencyOverride: inventoryLayer.addProficiencyOverride,
    removeProficiencyOverride: inventoryLayer.removeProficiencyOverride,
    refreshInventory: inventoryLayer.refreshInventory,
    // Historique & description
    backgrounds: background.backgrounds,
    selectedBackground: background.selectedBackground,
    setBackground: background.setBackground,
    createCustomBackground: background.createCustomBackground,
    personalityTraits: background.personalityTraits,
    ideals: background.ideals,
    bonds: background.bonds,
    flaws: background.flaws,
  }
}
