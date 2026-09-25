import { useStorage } from '@vueuse/core'
import { evaluate } from '~~/shared/utils/formula'
import type { FormulaContext } from '~~/shared/utils/formula'
import type { AbilityScoreKey, Effect } from '~~/server/db/schema/effects'
import type { SkillKey } from '~~/shared/rules/skills'
import { useCharacterClasses } from './character/useCharacterClasses'
import { useCharacterAbilities } from './character/useCharacterAbilities'
import { useCharacterConditions, binaryConditions } from './character/useCharacterConditions'
import { useCharacterSpellcasting } from './character/useCharacterSpellcasting'
import { useCharacterSpells } from './character/useCharacterSpells'
import { useCharacterInventory } from './character/useCharacterInventory'
import { useCharacterBackground } from './character/useCharacterBackground'
import { useCharacterIdentity } from './character/useCharacterIdentity'
import { sheetTextField } from './character/sheetField'

export type FeatChoices = { ability?: string, spellId?: number, skills?: string[], tools?: string[] } | null

/**
 * Résout les effets « à choix » d'un don selon les choix enregistrés (`character_features.choices`).
 * Sans choix enregistré, l'effet n'accorde rien. `ability_increase_choice`/`saving_throw_proficiency_choice`
 * lisent `choices.ability` (count 1) ; le marqueur `skilled_choice` (don Doué) lit `choices.skills`/`tools`
 * → une maîtrise de compétence/outil par entrée.
 */
export const resolveFeatEffects = (effects: Effect[], choices: FeatChoices): Effect[] =>
  effects.flatMap((e) => {
    if (e.type === 'ability_increase_choice') {
      const ability = choices?.ability
      if (!ability) return []
      return [{
        type: 'ability_increase' as const,
        value: { ability: ability as AbilityScoreKey, amount: e.value.amount },
      }]
    }
    if (e.type === 'saving_throw_proficiency_choice') {
      const ability = choices?.ability
      if (!ability || e.value.count !== 1) return []
      return [{
        type: 'saving_throw_proficiency' as const,
        value: { ability: ability as AbilityScoreKey },
      }]
    }
    if (e.type === 'other' && (e.value as { kind?: string }).kind === 'skilled_choice') {
      return [
        ...(choices?.skills ?? []).map((skill): Effect => ({ type: 'skill_proficiency', value: { skill: skill as SkillKey } })),
        ...(choices?.tools ?? []).map((tool): Effect => ({ type: 'tool_proficiency', value: tool })),
      ]
    }
    return [e]
  })

/**
 * Effets alimentant la couche abilities, dérivés du seul payload GET (ni fetch ni stockage). Fiche,
 * level-up et lentille de sorts doivent tous passer par ici : une reconstruction partielle fait diverger
 * maîtrises et caractéristiques d'un écran à l'autre.
 */
export const useAbilityEffectInputs = (characterSheet?: Ref<CharacterSheet | null | undefined>) => {
  const sheetClasses = computed(() => characterSheet?.value?.classes ?? [])

  const speciesEffects = computed<Effect[]>(() =>
    (characterSheet?.value?.species?.speciesFeatures ?? []).flatMap(sf =>
      (sf.feature?.featureEffects ?? []).map(fe => fe.effect).filter(Boolean),
    ) as Effect[],
  )

  const featureEffects = computed<Effect[]>(() => {
    const ccs = sheetClasses.value
    return (characterSheet?.value?.features ?? []).flatMap((cf) => {
      const feature = cf.feature!
      const effects = (feature.featureEffects?.map(fe => fe.effect).filter(Boolean) ?? []) as Effect[]
      if (feature.featureType === 'species_trait') return effects
      if (feature.featureType === 'eldritch_invocation') return effects
      if (feature.featureType === 'feat') return resolveFeatEffects(effects, (cf as { choices?: FeatChoices }).choices ?? null)
      const lvlReq = feature.levelRequired ?? 1
      const owner = feature.featureType === 'class_feature'
        ? ccs.find(c => c.classId === feature.classId)
        : ccs.find(c => c.subclass?.id === feature.subclassId)
      return owner && owner.level >= lvlReq ? effects : []
    })
  })

  const asiEffects = computed<Effect[]>(() => {
    const ccs = sheetClasses.value
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

  // Maîtrises dérivées par le GET (historique, JS de la classe principale, compétences de classe
  // choisies) : champs hors du type de relations Drizzle → accès casté.
  const backgroundEffects = computed<Effect[]>(() =>
    (characterSheet?.value as { backgroundEffects?: Effect[] } | null | undefined)?.backgroundEffects ?? [],
  )
  const classSavingThrowEffects = computed<Effect[]>(() =>
    (characterSheet?.value as { classSavingThrowEffects?: Effect[] } | null | undefined)?.classSavingThrowEffects ?? [],
  )
  const classSkillEffects = computed<Effect[]>(() =>
    (characterSheet?.value as { classSkillEffects?: Effect[] } | null | undefined)?.classSkillEffects ?? [],
  )

  return { speciesEffects, featureEffects, asiEffects, backgroundEffects, classSavingThrowEffects, classSkillEffects }
}

export const useCharacterSheet = (characterSheet?: Ref<CharacterSheet>) => {
  // ─── Couche 1 : classes, espèce ───────────────────────────────────────────

  const classes = useCharacterClasses(characterSheet)

  // ─── Couche 2 : scores de caractéristiques ────────────────────────────────

  const abilityInputs = useAbilityEffectInputs(characterSheet)
  const { speciesEffects, backgroundEffects } = abilityInputs

  const abilities = useCharacterAbilities(characterSheet, {
    ...abilityInputs,
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

  // Effets de base (espèce + classe + historique), hors objets magiques. `backgroundEffects` vient des
  // entrées de la couche abilities (qui en dérive les compétences). Champs hors du type de relations → casté.
  const classEffects = computed<Effect[]>(() =>
    (characterSheet?.value as { classEffects?: Effect[] } | undefined)?.classEffects ?? [],
  )
  const baseAllEffects = computed<Effect[]>(() => [
    ...speciesEffects.value,
    ...classFeatureEffects.value,
    ...backgroundEffects.value,
    ...classEffects.value,
  ])

  // Forward-declaration : la couche spellcasting a besoin des effets des objets magiques, alors que
  // l'inventaire est créé après elle (il lui faut spellcastingAbility).
  const inventoryEffectsRef = shallowRef<ComputedRef<Effect[]> | null>(null)
  const allEffectsForSpellcasting = computed<Effect[]>(() => [
    ...baseAllEffects.value,
    ...(inventoryEffectsRef.value?.value ?? []),
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

  inventoryEffectsRef.value = inventoryLayer.inventoryEffects

  const allEffects = allEffectsForSpellcasting

  // Vitesse de vol (ex. Fadette) — dérivée d'un effet `flying_speed` (trait d'espèce). 0 = pas de vol.
  const flyingSpeed = computed<number>(() => {
    const eff = allEffects.value.find(e => e.type === 'flying_speed')
    return typeof eff?.value === 'number' ? eff.value : 0
  })

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
    speed: classes.speed,
    abilityModifiers: abilities.abilityModifiers,
    maxHpBonus: abilities.hpBonusFromFeats,
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
    flyingSpeed,
    speciesTraits: classes.speciesTraits,
    speciesEffects,
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
    passiveInvestigation: abilities.passiveInvestigation,
    initiativeBonus: abilities.initiativeBonus,
    hpBonusFromFeats: abilities.hpBonusFromFeats,
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
