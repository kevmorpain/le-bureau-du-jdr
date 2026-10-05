import { useStorage } from '@vueuse/core'
import type { FormulaContext } from '~~/shared/utils/formula'
import type { Effect } from '~~/server/db/schema/effects'
import { asiEffectsOf, featureEffectsOf, resolveFeatEffects, speciesEffectsOf, type FeatChoices } from '~~/shared/rules/characterEffects'
import { spellDamageBonusParts, sumBonusParts, type EffectSource } from '~~/shared/rules/effectBonuses'
import { deriveClassTraits, featureFormulaContext, featureUses, isFeatureUnlocked, resourceFeaturesOf, resourceGroups as deriveResourceGroups } from '~~/shared/rules/classResources'
import type { OwnerClass } from '~~/shared/rules/classResources'
import { armorSpeedPenalty, computeWalkingSpeed, speedBonusParts } from '~~/shared/rules/speed'
import type { WornArmor } from '~~/shared/rules/speed'
import type { ArmorProperties } from '~~/server/db/schema/items'
import { useCharacterClasses } from './character/useCharacterClasses'
import { useCharacterAbilities } from './character/useCharacterAbilities'
import { useCharacterConditions, binaryConditions } from './character/useCharacterConditions'
import { useCharacterVitals } from './character/useCharacterVitals'
import { useCharacterSpellcasting } from './character/useCharacterSpellcasting'
import { useCharacterSpells } from './character/useCharacterSpells'
import { useCharacterInventory } from './character/useCharacterInventory'
import { useCharacterBackground } from './character/useCharacterBackground'
import { useCharacterIdentity } from './character/useCharacterIdentity'
import { useCharacterTemporaryEffects } from './character/useCharacterTemporaryEffects'
import { useCharacterRolls } from './character/useCharacterRolls'
import { useCharacterPreferences } from './character/useCharacterPreferences'
import { sheetTextField } from './character/sheetField'

/**
 * Effets alimentant la couche abilities, dérivés du seul payload GET (ni fetch ni stockage). Fiche,
 * level-up et lentille de sorts doivent tous passer par ici : une reconstruction partielle fait diverger
 * maîtrises et caractéristiques d'un écran à l'autre.
 */
export const useAbilityEffectInputs = (characterSheet?: Ref<CharacterSheet | null | undefined>) => {
  const speciesEffects = computed<Effect[]>(() => speciesEffectsOf(characterSheet?.value))
  const featureEffects = computed<Effect[]>(() => featureEffectsOf(characterSheet?.value))
  const asiEffects = computed<Effect[]>(() => asiEffectsOf(characterSheet?.value))

  // Maîtrises dérivées par le GET (historique, JS de la classe principale, maîtrises choisies sur un point
  // de choix) : champs hors du type de relations Drizzle → accès casté.
  const backgroundEffects = computed<Effect[]>(() =>
    (characterSheet?.value as { backgroundEffects?: Effect[] } | null | undefined)?.backgroundEffects ?? [],
  )
  const classSavingThrowEffects = computed<Effect[]>(() =>
    (characterSheet?.value as { classSavingThrowEffects?: Effect[] } | null | undefined)?.classSavingThrowEffects ?? [],
  )
  const choiceEffects = computed<Effect[]>(() =>
    (characterSheet?.value as { choiceEffects?: Effect[] } | null | undefined)?.choiceEffects ?? [],
  )

  return { speciesEffects, featureEffects, asiEffects, backgroundEffects, classSavingThrowEffects, choiceEffects }
}

export const useCharacterSheet = (characterSheet?: Ref<CharacterSheet>) => {
  // ─── Couche 1 : classes, espèce ───────────────────────────────────────────

  const classes = useCharacterClasses(characterSheet)

  // ─── Couche 2 : scores de caractéristiques ────────────────────────────────

  const abilityInputs = useAbilityEffectInputs(characterSheet)
  const { speciesEffects, backgroundEffects, choiceEffects } = abilityInputs

  const temporary = useCharacterTemporaryEffects(characterSheet)
  const prefs = useCharacterPreferences(characterSheet)

  // Forward-declaration : caractéristiques et incantation lisent les effets des objets actifs, alors que
  // l'inventaire est créé après elles (il lui faut leurs modificateurs et spellcastingAbility).
  const itemSourcesRef = shallowRef<ComputedRef<EffectSource[]> | null>(null)
  const heavyArmorRef = shallowRef<ComputedRef<boolean> | null>(null)
  const featureSourcesRef = shallowRef<ComputedRef<EffectSource[]> | null>(null)
  const activeEffectSources = computed<EffectSource[]>(() => [
    ...(itemSourcesRef.value?.value ?? []),
    ...temporary.temporaryEffectSources.value,
    ...(featureSourcesRef.value?.value ?? []),
  ])
  const activeEffects = computed<Effect[]>(() => activeEffectSources.value.flatMap(s => s.effects))

  const abilities = useCharacterAbilities(characterSheet, {
    ...abilityInputs,
    activeEffectSources,
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

  // Les formules d'une feature de classe s'évaluent au niveau de SA classe (multiclasse), pas de la classe principale.
  const ownerClasses = computed<OwnerClass[]>(() => characterSheet?.value?.classes ?? [])
  const resourceFeatures = computed(() => resourceFeaturesOf(characterSheet?.value?.features ?? []))

  const resolvedFeatures = computed(() =>
    (characterSheet?.value?.features ?? []).map((cf) => {
      const feature = cf.feature!
      const { maxUses, unlimited } = featureUses(
        resourceFeatures.value.find(f => f.id === cf.featureId)!,
        formulaContext.value,
        ownerClasses.value,
      )
      return {
        ...feature,
        currentUses: cf.currentUses,
        active: cf.active ?? false,
        maxUses,
        unlimited,
        source: (cf as any).source as string | null ?? null,
        classLevel: (cf as any).classLevel as number | null ?? null,
        choices: (cf as any).choices as FeatChoices ?? null,
        effects: feature.featureEffects?.map(fe => fe.effect).filter(Boolean) ?? [],
      }
    }),
  )

  // Les effets des DONS sont résolus (choix → effets concrets) : sans ça, les outils du don Doué
  // (marqueur `skilled_choice`) n'atteindraient pas `allEffects` → l'affichage des maîtrises d'outils.
  // Les compétences passent déjà par le canal résolu de la couche abilities (`useAbilityEffectInputs`).
  const classFeatureEffects = computed<Effect[]>(() =>
    resolvedFeatures.value.flatMap(f =>
      f.featureType === 'feat'
        ? resolveFeatEffects(f.effects as Effect[], f.choices)
        : (f.effects as Effect[])),
  )

  // ─── Ressources de classe : traits dérivés (attaques, dés, Rage) et réserves ──────────

  const classTraits = computed(() =>
    deriveClassTraits(resourceFeatures.value, formulaContext.value, ownerClasses.value, { heavyArmor: heavyArmorRef.value?.value ?? false }),
  )

  const resourceGroups = computed(() =>
    deriveResourceGroups(resourceFeatures.value, formulaContext.value, ownerClasses.value),
  )

  // Effets en vigueur tant qu'une capacité est active (Rage : résistances) ; suspendus par une armure lourde.
  featureSourcesRef.value = computed<EffectSource[]>(() =>
    resourceFeatures.value.flatMap(f =>
      f.active && f.meta?.whileActive && !(f.meta.suspendedByHeavyArmor && heavyArmorRef.value?.value)
        ? [{ label: f.name, effects: f.meta.whileActive }]
        : []),
  )

  // ─── Liste unifiée des capacités (espèce + classe + sous-classe) ──────────

  const allCharacterFeatures = computed(() => {
    const ccs = classes.characterClasses.value
    const speciesName = classes.species.value?.name ?? 'Espèce'
    // Les features de lignée sont badgées avec le nom de la lignée, pas celui de l'espèce de base.
    const lineageName = (classes.species.value as { lineageName?: string | null } | undefined)?.lineageName ?? null

    const speciesItems = classes.speciesTraits.value.map(f => ({
      ...f,
      currentUses: 0,
      maxUses: null as number | null,
      effects: (f.featureEffects?.map(fe => fe.effect).filter(Boolean) ?? []) as Effect[],
      origin: {
        kind: 'species' as const,
        label: (f as { lineageId?: number | null }).lineageId != null && lineageName ? lineageName : speciesName,
      },
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
      else if (f.featureType === 'eldritch_invocation') {
        label = 'Manifestation'
      }
      else if (f.featureType === 'fighting_style') {
        label = 'Style de combat'
      }
      else if (f.featureType === 'feat') {
        kind = 'class'
        label = 'Don'
      }
      return { ...f, origin: { kind, label } }
    })

    return [...speciesItems, ...classItems]
  })

  // Effets de base (espèce + classe + historique + choix), hors objets magiques. `backgroundEffects` et
  // `choiceEffects` viennent des entrées de la couche abilities (qui en dérive les compétences). Champs hors
  // du type de relations → casté.
  const classEffects = computed<Effect[]>(() =>
    (characterSheet?.value as { classEffects?: Effect[] } | undefined)?.classEffects ?? [],
  )
  const baseAllEffects = computed<Effect[]>(() => [
    ...speciesEffects.value,
    ...classFeatureEffects.value,
    ...backgroundEffects.value,
    ...classEffects.value,
    ...choiceEffects.value,
  ])

  const allEffectsForSpellcasting = computed<Effect[]>(() => [
    ...baseAllEffects.value,
    ...activeEffects.value,
  ])

  // ─── Couche 4 : incantation ───────────────────────────────────────────────
  // (avant conditions pour passer spellcastingAbility à l'inventaire)

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
    allEffects: allEffectsForSpellcasting,
    speciesEffects,
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
    temporaryEffectSources: temporary.temporaryEffectSources,
    classTraits,
  })

  itemSourcesRef.value = inventoryLayer.activeItemSources
  heavyArmorRef.value = computed(() =>
    (inventoryLayer.equippedBodyArmor.value?.item?.properties as ArmorProperties | undefined)?.armor_type === 'heavy',
  )

  const allEffects = allEffectsForSpellcasting

  // Vitesses de déplacement hors marche (vol de la Fadette, objets) : 0 = aucune ; elles ne s'additionnent pas.
  const movementSpeed = (type: 'flying_speed' | 'swimming_speed' | 'climbing_speed' | 'burrowing_speed') =>
    computed<number>(() => Math.max(0, ...allEffects.value.flatMap(e => (e.type === type ? [e.value] : []))))
  const flyingSpeed = movementSpeed('flying_speed')
  const swimmingSpeed = movementSpeed('swimming_speed')
  const climbingSpeed = movementSpeed('climbing_speed')
  const burrowingSpeed = movementSpeed('burrowing_speed')

  // ─── Vitesse de marche : espèce + bonus − pénalité d'armure ──────────────

  const wornArmor = computed<WornArmor>(() => ({
    heavy: heavyArmorRef.value?.value ?? false,
    body: !!inventoryLayer.equippedBodyArmor.value,
    shield: !!inventoryLayer.equippedShield.value,
  }))

  const speedBonuses = computed(() => speedBonusParts([
    { label: 'Espèce', effects: speciesEffects.value, context: formulaContext.value },
    ...resourceFeatures.value
      .filter(f => isFeatureUnlocked(f, ownerClasses.value))
      .map(f => ({ label: f.name, effects: f.effects, context: featureFormulaContext(formulaContext.value, f, ownerClasses.value) })),
    ...inventoryLayer.activeItemSources.value.map(s => ({ ...s, context: formulaContext.value })),
    ...temporary.temporaryEffectSources.value.map(s => ({ ...s, context: formulaContext.value })),
  ], wornArmor.value))

  const armorPenalty = computed(() => {
    const armor = inventoryLayer.equippedBodyArmor.value
    const props = armor?.item?.properties as ArmorProperties | undefined
    return armorSpeedPenalty(
      armor?.item && props ? { name: armor.item.name, armorType: props.armor_type, strengthRequirement: props.strength_requirement } : null,
      abilities.abilityScores.value.str?.total ?? 10,
      allEffects.value,
    )
  })

  const walkingSpeed = computed(() => computeWalkingSpeed(classes.speed.value, speedBonuses.value, armorPenalty.value))

  const speedDetail = computed(() => [
    `${classes.speed.value} m`,
    ...speedBonuses.value.map(b => `${formatModifier(b.amount)} m ${b.label}`),
    ...(armorPenalty.value ? [`-${armorPenalty.value.amount} m ${armorPenalty.value.source}`] : []),
  ].join(' '))

  // ─── Maîtrises de langues et outils ──────────────────────────────────────

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

  // ─── Identité, historique & description ───────────────────────────────────

  const identity = useCharacterIdentity(characterSheet)
  const background = useCharacterBackground(characterSheet)

  // ─── Notes de session (auto-save via deep watch dans [id].vue) ───────────

  const notes = sheetTextField(characterSheet, 'notes')

  // ─── Couche 3 : conditions, états, défenses ───────────────────────────────

  const conditions = useCharacterConditions(characterSheet, {
    allEffects,
    speed: walkingSpeed,
    abilityModifiers: abilities.abilityModifiers,
    hpPerLevelBonus: abilities.hpPerLevelBonus,
  })

  const vitals = useCharacterVitals(characterSheet)

  // ─── Jets : avantage, relance, critique ───────────────────────────────────

  // Capacités de l'espèce et des classes au niveau atteint (même garde que la couche caractéristiques), puis effets actifs.
  const capabilityEffects = computed<Effect[]>(() => [...speciesEffects.value, ...abilityInputs.featureEffects.value])
  const spellDamageBonus = computed(() =>
    sumBonusParts(spellDamageBonusParts([{ label: 'Capacités', effects: capabilityEffects.value }, ...activeEffectSources.value])),
  )
  const rollEngine = useCharacterRolls({
    characterId: characterSheet?.value?.id,
    activeConditions: conditions.activeConditions,
    exhaustionLevel: conditions.exhaustionLevel,
    armorNonProficient: computed(() => inventoryLayer.equippedArmorProficiencyWarning.value !== null),
    stealthArmor: inventoryLayer.armorStealthDisadvantage,
    effectSources: computed<EffectSource[]>(() => [{ label: 'Capacités', effects: capabilityEffects.value }, ...activeEffectSources.value]),
    allEffects: computed<Effect[]>(() => [...capabilityEffects.value, ...activeEffects.value]),
    getEffectiveProficiency: abilities.getEffectiveProficiency,
    criticalExtraDice: computed(() => classTraits.value.criticalExtraDice),
    rollsEnabled: computed(() => prefs.preferences.value.diceRolls),
  })

  // ─── Sort en concentration (résolu via characterSpells) ──────────────────

  const concentratingSpell = computed(() => {
    const id = conditions.concentratingSpellId.value
    if (id === null) return null
    return spells.characterSpells.value?.find(cs => cs.spellId === id)?.spell ?? null
  })

  // Nom affiché : le sort du catalogue, sinon le libellé libre ; un sort que la fiche ne connaît plus reste « inconnu ».
  const concentrationName = computed<string | null>(() => {
    if (!conditions.isConcentrating.value) return null
    return concentratingSpell.value?.name ?? conditions.concentratingOn.value ?? 'Sort inconnu'
  })

  // Lancer un sort à concentration met fin à la concentration en cours : on le dit.
  const startConcentration = (spellId: number, spellName: string) => {
    const lost = conditions.concentratingSpellId.value === spellId ? null : concentrationName.value
    conditions.setConcentration(spellId)
    useToast().add({
      title: `Concentration active — ${spellName}`,
      description: lost ? `Vous perdez la concentration sur ${lost}.` : undefined,
      color: 'info',
    })
  }

  // ─── API publique ─────────────────────────────────────────────────────────

  return {
    // Classes & espèce
    species: classes.species,
    speed: classes.speed,
    flyingSpeed,
    swimmingSpeed,
    climbingSpeed,
    burrowingSpeed,
    speciesTraits: classes.speciesTraits,
    speciesEffects,
    characterLevel: classes.characterLevel,
    mainClass: classes.mainClass,
    multiClass: classes.multiClass,
    hitDice: classes.hitDice,
    proficiencyBonus: classes.proficiencyBonus,
    armorClass: inventoryLayer.computedAC,
    // Features & effets
    resolvedFeatures,
    allCharacterFeatures,
    classTraits,
    resourceGroups,
    wearsHeavyArmor: computed(() => heavyArmorRef.value?.value ?? false),
    allEffects,
    // Caractéristiques
    abilityScores: abilities.abilityScores,
    abilityModifiers: abilities.abilityModifiers,
    abilityCheckModifiers: abilities.abilityCheckModifiers,
    abilitySkillKeys: abilities.abilitySkillKeys,
    abilityScoreBonuses: abilities.abilityScoreBonuses,
    getEffectiveProficiency: abilities.getEffectiveProficiency,
    getSkillModifier: abilities.getSkillModifier,
    savingThrows: abilities.savingThrows,
    savingThrowBonuses: abilities.savingThrowBonuses,
    passivePerception: abilities.passivePerception,
    passiveInvestigation: abilities.passiveInvestigation,
    initiativeBonus: abilities.initiativeBonus,
    hpPerLevelBonus: abilities.hpPerLevelBonus,
    // PV, jets contre la mort
    hitPointState: vitals.hitPointState,
    setHitPointState: vitals.setHitPointState,
    isDead: vitals.isDead,
    isDying: vitals.isDying,
    isStable: vitals.isStable,
    // Conditions & états
    binaryConditions,
    activeConditions: conditions.activeConditions,
    toggleCondition: conditions.toggleCondition,
    concentratingSpellId: conditions.concentratingSpellId,
    concentratingOn: conditions.concentratingOn,
    isConcentrating: conditions.isConcentrating,
    setConcentration: conditions.setConcentration,
    setFreeConcentration: conditions.setFreeConcentration,
    startConcentration,
    concentratingSpell,
    concentrationName,
    exhaustionLevel: conditions.exhaustionLevel,
    exhaustionTooltip: conditions.exhaustionTooltip,
    hasDraconicAncestry: conditions.hasDraconicAncestry,
    dragonbornAncestry: conditions.dragonbornAncestry,
    defenseEntries: conditions.defenseEntries,
    effectiveSpeed: conditions.effectiveSpeed,
    speedDetail,
    speedModifiers: computed(() => [
      ...(armorPenalty.value ? [armorPenalty.value.reason] : []),
      ...conditions.speedModifiers.value,
    ]),
    fullMaxHp: conditions.fullMaxHp,
    effectiveMaxHp: conditions.effectiveMaxHp,
    maxHitPointsFor: conditions.maxHitPointsFor,
    skillDisadvantageReasons: conditions.skillDisadvantageReasons,
    saveStatuses: conditions.saveStatuses,
    rollEngine,
    spellDamageBonus,
    // Préférences (fiche, défauts du compte)
    preferences: prefs.preferences,
    ownPreferences: prefs.ownPreferences,
    accountPreferences: prefs.accountPreferences,
    setPreference: prefs.setPreference,
    // Effets temporaires
    temporaryEffects: temporary.temporaryEffects,
    saveTemporaryEffect: temporary.saveTemporaryEffect,
    toggleTemporaryEffect: temporary.toggleTemporaryEffect,
    removeTemporaryEffect: temporary.removeTemporaryEffect,
    // Incantation
    spellcastingAbility: spellcasting.spellcastingAbility,
    spellcastingModifier: spellcasting.spellcastingModifier,
    spellAttackModifier: spellcasting.spellAttackModifier,
    spellSaveDC: spellcasting.spellSaveDC,
    spellcastingStats: spellcasting.spellcastingStats,
    pactMagicStats: spellcasting.pactMagicStats,
    pactMagicAbility: spellcasting.pactMagicAbility,
    statsForCasterClass: spellcasting.statsForCasterClass,
    statsForSpell: spellcasting.statsForSpell,
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
    toggleAttuned: inventoryLayer.toggleAttuned,
    attunedCount: inventoryLayer.attunedCount,
    setUsingTwoHanded: inventoryLayer.setUsingTwoHanded,
    addProficiencyOverride: inventoryLayer.addProficiencyOverride,
    removeProficiencyOverride: inventoryLayer.removeProficiencyOverride,
    refreshInventory: inventoryLayer.refreshInventory,
    // Identité & description
    ...identity,
    // Historique & description
    backgrounds: background.backgrounds,
    selectedBackground: background.selectedBackground,
    setBackground: background.setBackground,
    createCustomBackground: background.createCustomBackground,
    personalityTraits: background.personalityTraits,
    ideals: background.ideals,
    bonds: background.bonds,
    flaws: background.flaws,
    // Notes de session
    notes,
  }
}
