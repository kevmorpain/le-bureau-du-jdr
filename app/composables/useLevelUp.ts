import {
  CLASSES,
  ABILITIES,
  ABILITY_SHORT,
  ABILITY_LABELS,
  SKILLS,
  spellSlotsAtLevel,
  profBonusAtLevel,
  abilityMod,
  formatMod,
  type AbilityKey,
} from '~/data/character-builder'
import { SKILLED_FEAT_COUNT } from '~~/shared/rules/tools'
import { spellLearningOf, spellsLearnedOnLevelUp } from '~~/shared/rules/spellsKnown'
import { maxSpellLevelForLevel } from '~~/shared/rules/spellSlots'
import {
  meetsMulticlassPrerequisites,
  multiclassSkillGrant,
  type MulticlassPrerequisites,
  type MulticlassSkillGrant,
} from '~~/shared/rules/multiclass'
import { proficiencyLabels } from '~~/shared/utils/item'
import { choicesGainedAtLevelUp, isProficiencyPickChoice, type ResolvedChoice } from '~~/shared/rules/resolve'
import type { CharacterSheet, Spell } from '~~/server/utils/drizzle'
import type { Effect } from '~~/server/db/schema/effects'
import { useCharacterAbilities, type ProficiencyLevel } from './character/useCharacterAbilities'
import { featLanguageChoiceCount, useAbilityEffectInputs } from './useCharacterSheet'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AbilityBonuses = Record<AbilityKey, number>

export interface LevelUpState {
  pickedClassId: string | null
  isMulticlass: boolean
  fromLevel: number
  toLevel: number
  hpMethod: 'average' | 'roll' | 'manual'
  hpRolled: number | null
  hpManual: number | null
  newSubclassId: number | null
  newSubclassName: string | null
  fightingStyle: string | null
  expertiseSkills: string[]
  asiChoice: 'asi' | 'feat' | null
  asiBonuses: AbilityBonuses
  featureId: number | null
  featAbility: AbilityKey | null
  // Don Doué : 3 maîtrises au choix (compétences + outils, total = SKILLED_FEAT_COUNT).
  featSkills: string[]
  featTools: string[]
  // Don Linguiste : langues au choix.
  featLanguages: string[]
  newSkills: string[]
  // Picks des points de choix gagnés à ce niveau (instrument du Barde rejoint), par id de progression.
  choicePicks: Record<number, Array<string | number>>
  newCantripIds: number[]
  newSpellIds: number[]
  pactBoon: 'chain' | 'blade' | 'tome' | null
  pactWeaponInventoryId: number | null
  pactBoonCantripIds: number[]
  newInvocationIds: number[]
  replacedInvocationId: number | null
  newMetamagicIds: number[]
  // Sort choisi pour l'Arcane Mystérieux (niveau 11/13/15/17). Le niveau du sort
  // dépend du niveau d'occultiste atteint (cf. arcaneMysteriumSpellLevel, dérivé du catalogue).
  arcaneMysteriumSpellId: number | null
  bookOfAncientSecretsSpellIds: number[]
  // Flag positionné par le composant Magie quand l'invocation « Livre des anciens
  // secrets » est dans les choix de cette montée de niveau. Sert à valider le
  // step (2 sorts rituels obligatoires).
  bookOfAncientSecretsRequired: boolean
}

export const BOOK_OF_ANCIENT_SECRETS_NAME = 'Livre des secrets anciens'

const INIT_STATE: LevelUpState = {
  pickedClassId: null,
  isMulticlass: false,
  fromLevel: 0,
  toLevel: 1,
  hpMethod: 'average',
  hpRolled: null,
  hpManual: null,
  newSubclassId: null,
  newSubclassName: null,
  fightingStyle: null,
  expertiseSkills: [],
  asiChoice: null,
  asiBonuses: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
  featureId: null,
  featAbility: null,
  featSkills: [],
  featTools: [],
  featLanguages: [],
  newSkills: [],
  choicePicks: {},
  newCantripIds: [],
  newSpellIds: [],
  pactBoon: null,
  pactWeaponInventoryId: null,
  pactBoonCantripIds: [],
  newInvocationIds: [],
  replacedInvocationId: null,
  newMetamagicIds: [],
  arcaneMysteriumSpellId: null,
  bookOfAncientSecretsSpellIds: [],
  bookOfAncientSecretsRequired: false,
}

// Copie profonde : les étapes modifient tableaux et objets en place (push, splice…), ce qui
// polluerait INIT_STATE via une copie superficielle.
const freshState = (): LevelUpState => structuredClone(INIT_STATE)

export interface LUStep {
  id: string
  label: string
  icon: string
}

const ALL_LU_STEPS: LUStep[] = [
  { id: 'class', label: 'Classe', icon: 'i-game-icons:sword' },
  { id: 'hp', label: 'Points de vie', icon: 'i-heroicons:heart' },
  { id: 'features', label: 'Aptitudes', icon: 'i-heroicons:sparkles' },
  { id: 'asi', label: 'Carac. / Don', icon: 'i-heroicons:arrow-trending-up' },
  { id: 'skills', label: 'Maîtrises', icon: 'i-heroicons:academic-cap' },
  { id: 'spells', label: 'Magie', icon: 'i-game-icons:spell-book' },
]

// ─── Extended character type (includes abilityScoreImprovements from GET) ─────

export type CharacterSheetWithASI = CharacterSheet & {
  abilityScoreImprovements?: Array<{ ability: AbilityKey, amount: number, classId: number, classLevel: number }>
}

// ─── Composable ───────────────────────────────────────────────────────────────

export function useLevelUp(charSheet: Ref<CharacterSheetWithASI | null>) {
  const state = useState<LevelUpState>('level-up-state', freshState)
  const toast = useToast()

  const { getById: getFeatById } = useFeats()
  const featNeedsAbility = (featureId: number | null): boolean => {
    if (featureId == null) return false
    return (getFeatById(featureId)?.effects ?? []).some((e: any) => e.type === 'ability_increase_choice')
  }
  const featNeedsSkilled = (featureId: number | null): boolean => {
    if (featureId == null) return false
    return (getFeatById(featureId)?.effects ?? []).some((e: any) => e.type === 'other' && (e.value as any)?.kind === 'skilled_choice')
  }
  const featLanguageCount = (featureId: number | null): number =>
    featureId == null ? 0 : featLanguageChoiceCount((getFeatById(featureId)?.effects ?? []) as Effect[])
  const buildFeatChoices = (s: LevelUpState): { ability?: AbilityKey, skills?: string[], tools?: string[], languages?: string[] } | null => {
    if (s.featureId == null) return null
    if (featNeedsSkilled(s.featureId)) return { skills: s.featSkills, tools: s.featTools }
    if (featLanguageCount(s.featureId) > 0) return { languages: s.featLanguages }
    if (s.featAbility) return { ability: s.featAbility }
    return null
  }

  // ── Derived character data ─────────────────────────────────────────────────

  const charClasses = computed(() => {
    return (charSheet.value?.classes ?? []).map((cc) => {
      const cls = CLASSES.find(c => c.dbName === (cc as any).class?.name)
      return {
        dbClassId: cc.classId,
        classId: cls?.id ?? (cc as any).class?.name?.toLowerCase() ?? '',
        className: (cc as any).class?.name ?? '',
        level: cc.level,
        isMain: cc.isMain,
        dbSubclassId: (cc as any).subclassId ?? null,
        subclassName: (cc as any).subclass?.name ?? null,
        pactBoon: (cc as any).pactBoon ?? null,
        hitDie: cls?.hitDie ?? 8,
        color: cls?.color ?? '#a1a1aa',
        emoji: cls?.emoji ?? '⚔️',
        data: cls ?? null,
      }
    })
  })

  const totalLevel = computed(() => charClasses.value.reduce((s, c) => s + c.level, 0))

  // Caractéristiques et maîtrises lues dans la MÊME couche que la fiche : le stocké ne porte ni les bonus
  // d'espèce fixes ni ceux des dons, et `character_skills` que les overrides et l'expertise.
  const abilityInputs = useAbilityEffectInputs(charSheet)
  const sheetAbilities = useCharacterAbilities(charSheet, {
    ...abilityInputs,
    proficiencyBonus: computed(() => profBonusAtLevel(totalLevel.value)),
  })

  const finalAbilities = computed<Record<AbilityKey, number>>(() =>
    Object.fromEntries(ABILITIES.map(ab => [ab, sheetAbilities.abilityScores.value[ab]?.total ?? 10])) as Record<AbilityKey, number>,
  )

  const skillsWhere = (keep: (level: ProficiencyLevel) => boolean) =>
    SKILLS.filter(s => keep(sheetAbilities.getEffectiveProficiency(s.key)))

  const expertSkills = computed<string[]>(() => skillsWhere(l => l === 'expert').map(s => s.key))
  const proficientSkills = computed<string[]>(() => skillsWhere(l => l !== 'none').map(s => s.key))
  const eligibleExpertiseSkills = computed(() => skillsWhere(l => l === 'proficient'))

  // Outils et langues ajoutés à la main : stockés en overrides, ABSENTS du payload
  // GET → fetch dédié (comme la fiche). Sert à exclure des pickers de Doué et de Linguiste.
  const { data: proficiencyOverridesData } = useFetch<Array<{ proficiencyType: string, value: string, action: string }>>(
    () => (charSheet.value?.id != null ? `/api/character_sheets/${charSheet.value.id}/proficiency-overrides` : null),
    { default: () => [] },
  )

  // Maîtrises d'outils ou de langues de la fiche (effets + ajouts manuels), comme la fiche les calcule.
  const ownedProficiencies = (type: 'tool' | 'language') => {
    const effectType = type === 'tool' ? 'tool_proficiency' : 'language_proficiency'
    const classEffects = (charSheet.value as { classEffects?: Effect[] } | null)?.classEffects ?? []
    const fromEffects = [
      ...abilityInputs.speciesEffects.value,
      ...abilityInputs.featureEffects.value,
      ...abilityInputs.backgroundEffects.value,
      ...abilityInputs.choiceEffects.value,
      ...classEffects,
    ].filter(e => e.type === effectType).map(e => e.value as string)
    const ov = proficiencyOverridesData.value ?? []
    const grants = ov.filter(o => o.proficiencyType === type && o.action === 'grant').map(o => o.value)
    const revokes = new Set(ov.filter(o => o.proficiencyType === type && o.action === 'revoke').map(o => o.value))
    return [...new Set([...fromEffects, ...grants])].filter(t => !revokes.has(t))
  }
  const ownedTools = computed<string[]>(() => ownedProficiencies('tool'))
  const knownLanguages = computed<string[]>(() => ownedProficiencies('language'))

  const currentSpellIds = computed<number[]>(() => {
    return (charSheet.value?.spells ?? []).map((s: any) => s.spellId ?? s.id)
  })

  // ── Picked class data ──────────────────────────────────────────────────────

  const pickedClass = computed(() => {
    if (!state.value.pickedClassId) return null
    return CLASSES.find(c => c.id === state.value.pickedClassId) ?? null
  })

  const pickedCharClass = computed(() => {
    if (!state.value.pickedClassId || state.value.isMulticlass) return null
    return charClasses.value.find(c => c.classId === state.value.pickedClassId) ?? null
  })

  const conMod = computed(() => abilityMod(finalAbilities.value.con))

  const averageHpGain = computed(() => {
    if (!pickedClass.value) return 0
    const die = pickedClass.value.hitDie
    return Math.ceil(die / 2) + 1 + conMod.value
  })

  const hpGained = computed(() => {
    const s = state.value
    if (s.hpMethod === 'average') return averageHpGain.value
    if (s.hpMethod === 'manual' && s.hpManual != null) return Math.max(1, s.hpManual + conMod.value)
    if (s.hpMethod === 'roll' && s.hpRolled != null) return Math.max(1, s.hpRolled + conMod.value)
    return null
  })

  // ── Choix de progression lus dans le CATALOGUE (/api/catalog, lot 6a) ──────
  // Choix résolus aux niveaux d'ARRIVÉE et de DÉPART : le delta pilote le nombre de nouvelles
  // invocations et compétences d'expertise.
  const { catalog, choicesForClassLevel } = useCatalog()
  const {
    resolveClassId,
    subclassCatalogFor,
    multiclassSkillCountFor,
    multiclassPrerequisitesFor,
    classProficienciesFor,
  } = useBuilderEntities()
  const classDbIdOf = (classSlug: string) => resolveClassId(CLASSES.find(c => c.id === classSlug)?.dbName)
  const luClassDbId = computed(() =>
    charClasses.value.find(c => c.classId === state.value.pickedClassId)?.dbClassId
    ?? resolveClassId(pickedClass.value?.dbName),
  )
  const choicesAtToLevel = computed(() => choicesForClassLevel(luClassDbId.value, state.value.toLevel))
  const choicesAtFromLevel = computed(() => choicesForClassLevel(luClassDbId.value, state.value.fromLevel))

  const multiclassSkills = computed<MulticlassSkillGrant>(() => {
    const dbId = luClassDbId.value
    if (!state.value.isMulticlass || dbId == null) return { count: 0, options: [] }
    return multiclassSkillGrant(dbId, multiclassSkillCountFor(dbId), catalog.value)
  })

  // Prérequis de multiclassage, affichés sans bloquer. AideDD : « les valeurs de caractéristiques requises
  // par votre classe actuelle et par la nouvelle classe » — pour un personnage déjà multiclassé, chaque
  // classe détenue.
  const currentClassesPrerequisites = computed(() => charClasses.value.map(c => ({
    className: c.className,
    prerequisites: multiclassPrerequisitesFor(c.dbClassId),
  })))
  const multiclassPrerequisitesOf = (classSlug: string): MulticlassPrerequisites =>
    multiclassPrerequisitesFor(classDbIdOf(classSlug))
  const meetsCurrentClassesPrerequisites = computed(() =>
    currentClassesPrerequisites.value.every(c => meetsMulticlassPrerequisites(c.prerequisites, finalAbilities.value)))
  const meetsTargetPrerequisites = (classSlug: string): boolean =>
    meetsMulticlassPrerequisites(multiclassPrerequisitesOf(classSlug), finalAbilities.value)

  // Ce que rejoindre une classe accorde (AideDD, tableau des maîtrises du multiclassage) : son porteur de
  // multiclassage et son nombre de compétences, lus dans le catalogue comme les prérequis.
  const multiclassGainsOf = (classSlug: string): { proficiencies: string[], skillCount: number } => {
    const dbId = classDbIdOf(classSlug)
    return {
      proficiencies: proficiencyLabels(classProficienciesFor(dbId).multiclass),
      skillCount: multiclassSkillCountFor(dbId),
    }
  }

  // ── Pact Boon availability (Warlock level 3) ──────────────────────────────

  const needsPactBoon = computed(() => {
    const existingPactBoon = (pickedCharClass.value as any)?.pactBoon ?? null
    if (existingPactBoon) return false
    // Le pacte se débloque À un niveau précis (owner niv.3) : `ownerLevelRequired === toLevel`
    // reproduit l'ancien « toLevel === 3 » sans coder le niveau en dur.
    return choicesAtToLevel.value.some(c => c.kind === 'pact_boon' && c.ownerLevelRequired === state.value.toLevel)
  })

  // ── Manifestations occultes (Warlock niveaux 2/5/7/9/12/15/18) ─────────────

  const invocationsAtToLevel = computed(() => choicesAtToLevel.value.find(c => c.kind === 'invocations')?.count ?? 0)
  const invocationsAtFromLevel = computed(() => choicesAtFromLevel.value.find(c => c.kind === 'invocations')?.count ?? 0)
  const newInvocationsCount = computed(() =>
    Math.max(0, invocationsAtToLevel.value - invocationsAtFromLevel.value),
  )

  const needsInvocations = computed(() => newInvocationsCount.value > 0)
  const canReplaceInvocation = computed(() =>
    state.value.pickedClassId === 'warlock'
    && !state.value.isMulticlass
    && invocationsAtFromLevel.value > 0,
  )

  const knownInvocationIds = computed<number[]>(() => {
    const features = (charSheet.value as any)?.features ?? []
    return features
      .filter((f: any) => f.feature?.featureType === 'eldritch_invocation')
      .map((f: any) => f.feature.id)
  })

  // ── Métamagie (Ensorceleur niveaux 3/10/17) ────────────────────────────────
  const metamagicAtToLevel = computed(() => choicesAtToLevel.value.find(c => c.kind === 'metamagic')?.count ?? 0)
  const metamagicAtFromLevel = computed(() => choicesAtFromLevel.value.find(c => c.kind === 'metamagic')?.count ?? 0)
  const newMetamagicCount = computed(() => Math.max(0, metamagicAtToLevel.value - metamagicAtFromLevel.value))
  const needsMetamagic = computed(() => newMetamagicCount.value > 0)
  // NB : pas de `canReplaceMetamagic` — la Métamagie 2014 n'est pas remplaçable au level-up
  // (contrairement aux invocations occultes). On n'ajoute que de nouvelles options.
  const knownMetamagicIds = computed<number[]>(() => {
    const features = (charSheet.value as any)?.features ?? []
    return features
      .filter((f: any) => f.feature?.tag === 'metamagic')
      .map((f: any) => f.feature.id)
  })

  const effectivePactBoon = computed<'chain' | 'blade' | 'tome' | null>(() => {
    return ((pickedCharClass.value as any)?.pactBoon ?? null) ?? state.value.pactBoon
  })

  const knownSpellNames = computed<string[]>(() => {
    const spells = (charSheet.value?.spells ?? []) as any[]
    return spells.map(s => s.spell?.name ?? '').filter(Boolean)
  })

  // ── Arcane Mystérieux (Occultiste niveaux 11 / 13 / 15 / 17) ───────────────

  const arcaneMysteriumSpellLevel = computed<number | null>(() => {
    const c = choicesAtToLevel.value.find(ch => ch.kind === 'spell' && ch.ownerLevelRequired === state.value.toLevel)
    return c && c.optionSource.type === 'spells' ? c.optionSource.maxLevel ?? null : null
  })
  const needsArcaneMysterium = computed(() => arcaneMysteriumSpellLevel.value !== null)

  // ── Livre des anciens secrets — sorts rituels (manifestation TCoE) ─────────

  const picksBookOfAncientSecrets = (allInvocationsByName: Record<string, number>) => {
    const id = allInvocationsByName[BOOK_OF_ANCIENT_SECRETS_NAME]
    if (!id) return false
    return state.value.newInvocationIds.includes(id)
  }

  // ── Subclass availability (lue dans le CATALOGUE, F2 tranche 3) ────────────

  const isSubclassLevel = computed(() => {
    if (!state.value.pickedClassId) return false
    // Classe existante ayant déjà sa sous-classe → ne pas re-demander.
    if (!state.value.isMulticlass && pickedCharClass.value?.subclassName) return false
    return choicesAtToLevel.value.some(c => c.kind === 'subclass' && c.ownerLevelRequired === state.value.toLevel)
  })

  function subclassLevelFor(builderClassId: string): number | null {
    const cls = CLASSES.find(c => c.id === builderClassId)
    return subclassCatalogFor(resolveClassId(cls?.dbName))?.subclassLevel ?? null
  }

  // ── Step visibility ────────────────────────────────────────────────────────

  // Owner discret par palier (count 1) — dû au niveau d'arrivée, PAS un delta cumulatif comme l'expertise.
  const isAsiLevel = computed(() => {
    if (!state.value.pickedClassId) return false
    return choicesAtToLevel.value.some(c => c.kind === 'asi_or_feat' && c.ownerLevelRequired === state.value.toLevel)
  })

  // Badge de LevelUpStepClass — discret (pas un delta), cf. isAsiLevel.
  function asiDueForClassLevel(builderClassId: string, level: number): boolean {
    if (level < 1) return false
    const cls = CLASSES.find(c => c.id === builderClassId)
    const dbId = resolveClassId(cls?.dbName)
    if (!dbId) return false
    return choicesForClassLevel(dbId, level).some(c => c.kind === 'asi_or_feat' && c.ownerLevelRequired === level)
  }

  // Style de combat (lu dans le CATALOGUE, F2 tranche 4) — débloqué AU niveau d'arrivée
  // (`ownerLevelRequired === toLevel`), miroir de isSubclassLevel/needsPactBoon.
  const needsFightingStyle = computed(() => {
    if (!state.value.pickedClassId) return false
    return choicesAtToLevel.value.some(c => c.kind === 'fighting_style' && c.ownerLevelRequired === state.value.toLevel)
  })

  // Niveau d'accès au style de combat d'une classe (par builderId), lu dans le catalogue — sert au
  // badge de LevelUpStepClass. On résout au niveau 20 (le point de choix est alors présent) et on lit
  // son `ownerLevelRequired`. `null` si la classe n'a pas de style (ou catalogue pas chargé).
  function fightingStyleLevelFor(builderClassId: string): number | null {
    const cls = CLASSES.find(c => c.id === builderClassId)
    const dbId = resolveClassId(cls?.dbName)
    if (!dbId) return null
    return choicesForClassLevel(dbId, 20).find(c => c.kind === 'fighting_style')?.ownerLevelRequired ?? null
  }

  // Expertise : count CUMULATIF (comme les invocations) — le delta départ→arrivée donne le nombre
  // de nouvelles compétences à doubler.
  const expertiseAtToLevel = computed(() => choicesAtToLevel.value.find(c => c.kind === 'expertise')?.count ?? 0)
  const expertiseAtFromLevel = computed(() => choicesAtFromLevel.value.find(c => c.kind === 'expertise')?.count ?? 0)
  const newExpertiseCount = computed(() => Math.max(0, expertiseAtToLevel.value - expertiseAtFromLevel.value))
  const needsExpertise = computed(() => newExpertiseCount.value > 0)

  // Un palier d'expertise tombe-t-il à ce niveau de classe ? (delta > 0) — sert au badge de LevelUpStepClass.
  function expertiseDueForClassLevel(builderClassId: string, level: number): boolean {
    if (level < 1) return false
    const cls = CLASSES.find(c => c.id === builderClassId)
    const dbId = resolveClassId(cls?.dbName)
    if (!dbId) return false
    const at = choicesForClassLevel(dbId, level).find(c => c.kind === 'expertise')?.count ?? 0
    const prev = choicesForClassLevel(dbId, level - 1).find(c => c.kind === 'expertise')?.count ?? 0
    return at - prev > 0
  }

  // Points de choix de maîtrise que ce niveau de classe rend dus : porteur de multiclassage d'une classe
  // rejointe (instrument du Barde)…
  const mainClassDbId = computed(() => charClasses.value.find(c => c.isMain)?.dbClassId ?? charClasses.value[0]?.dbClassId)
  const newPickChoices = computed<ResolvedChoice[]>(() => {
    const classId = luClassDbId.value
    if (classId == null) return []
    return choicesGainedAtLevelUp(catalog.value, {
      classId,
      fromLevel: state.value.fromLevel,
      toLevel: state.value.toLevel,
      mainClassId: mainClassDbId.value ?? classId,
    }).filter(isProficiencyPickChoice)
  })
  const picksOf = (progressionId: number): Array<string | number> => state.value.choicePicks[progressionId] ?? []
  const ownedFor = (choice: ResolvedChoice): string[] => {
    if (choice.kind === 'skill') return proficientSkills.value
    if (choice.kind === 'language') return knownLanguages.value
    return [...ownedTools.value, ...knownLanguages.value]
  }

  const needsMulticlassSkills = computed(() => multiclassSkills.value.count > 0)
  // Plafonné aux compétences pas encore maîtrisées, comme les sorts : une liste épuisée ne bloque pas l'étape.
  const requiredMulticlassSkillPicks = computed(() => {
    const owned = new Set(proficientSkills.value)
    return Math.min(multiclassSkills.value.count, multiclassSkills.value.options.filter(k => !owned.has(k)).length)
  })

  const hasSpellcasting = computed(() => {
    if (!pickedClass.value?.spellcasting) return false
    const startsAt = pickedClass.value.spellcasting.startsAtLevel ?? 1
    return state.value.toLevel >= startsAt
  })

  // ── Nouveaux sorts (étape Magie) ──────────────────────────────────────────

  const spellLearning = computed(() => spellLearningOf(state.value.pickedClassId ?? ''))
  const spellsLearned = computed(() => hasSpellcasting.value
    ? spellsLearnedOnLevelUp(state.value.pickedClassId ?? '', state.value.fromLevel, state.value.toLevel)
    : { cantrips: 0, spells: 0 })
  const cantripsToLearn = computed(() => spellsLearned.value.cantrips)
  const spellsToLearn = computed(() => spellsLearned.value.spells)

  // Plafonné par le niveau DANS la classe montée, pas par les emplacements combinés du multiclassage.
  const maxLearnableSpellLevel = computed(() => {
    const type = pickedClass.value?.spellcasting?.type
    return type && hasSpellcasting.value ? maxSpellLevelForLevel(type, state.value.toLevel) : 0
  })

  const { extendedQuery } = useExtendedContent()
  const classSpellsQuery = computed(() => ({
    className: hasSpellcasting.value ? pickedClass.value?.dbName ?? '' : '',
    ...extendedQuery.value,
  }))
  const { data: classSpellsData, pending: classSpellsPending } = useAsyncData<Spell[]>(
    () => `level-up-class-spells:${JSON.stringify(classSpellsQuery.value)}`,
    () => (classSpellsQuery.value.className
      ? $fetch<Spell[]>('/api/spells', { query: classSpellsQuery.value })
      : Promise.resolve([])),
    { default: () => [] },
  )
  const classSpells = computed<Spell[]>(() => classSpellsData.value ?? [])

  const learnableCantrips = computed(() => classSpells.value.filter(s => s.level === 0))
  const learnableSpells = computed(() =>
    classSpells.value.filter(s => s.level >= 1 && s.level <= maxLearnableSpellLevel.value),
  )

  // Choix exigés = dû, plafonné aux candidats encore inconnus : un catalogue incomplet ne doit pas
  // bloquer l'étape. Pendant le chargement, on exige le dû entier.
  const requiredPicks = (due: number, candidates: Spell[]) => {
    if (classSpellsPending.value) return due
    const available = candidates.filter(s => !currentSpellIds.value.includes(s.id)).length
    return Math.min(due, available)
  }
  const requiredCantripPicks = computed(() => requiredPicks(cantripsToLearn.value, learnableCantrips.value))
  const requiredSpellPicks = computed(() => requiredPicks(spellsToLearn.value, learnableSpells.value))

  // ── Active steps ───────────────────────────────────────────────────────────

  const activeSteps = computed(() => ALL_LU_STEPS.filter(s => {
    if (s.id === 'asi') return isAsiLevel.value
    if (s.id === 'skills') return needsMulticlassSkills.value || newPickChoices.value.length > 0
    if (s.id === 'spells') return hasSpellcasting.value
    return true
  }))

  // ── Navigation ─────────────────────────────────────────────────────────────

  const currentStepId = useState<string>('level-up-step', () => 'class')

  const currentIdx = computed(() => activeSteps.value.findIndex(s => s.id === currentStepId.value))
  const currentStep = computed(() => activeSteps.value[currentIdx.value] ?? null)
  const isLastStep = computed(() => currentIdx.value === activeSteps.value.length - 1)
  const canGoPrev = computed(() => currentIdx.value > 0)

  // ── Step validation ────────────────────────────────────────────────────────

  const isStepComplete = computed(() => (stepId: string): boolean => {
    const s = state.value
    switch (stepId) {
      case 'class':
        return !!s.pickedClassId

      case 'hp':
        return hpGained.value != null && hpGained.value > 0

      case 'features': {
        if (isSubclassLevel.value && !s.newSubclassId) return false
        if (needsFightingStyle.value && !s.fightingStyle) return false
        if (needsExpertise.value && s.expertiseSkills.length < newExpertiseCount.value) return false
        if (needsPactBoon.value && !s.pactBoon) return false
        const expectedInvocations = newInvocationsCount.value + (s.replacedInvocationId ? 1 : 0)
        if (expectedInvocations > 0 && s.newInvocationIds.length < expectedInvocations) return false
        if (newMetamagicCount.value > 0 && s.newMetamagicIds.length < newMetamagicCount.value) return false
        return true
      }

      case 'asi': {
        if (s.asiChoice === 'feat') {
          if (s.featureId == null) return false
          if (featNeedsAbility(s.featureId) && !s.featAbility) return false
          if (featNeedsSkilled(s.featureId) && (s.featSkills.length + s.featTools.length) !== SKILLED_FEAT_COUNT) return false
          if (s.featLanguages.length !== featLanguageCount(s.featureId)) return false
          return true
        }
        if (s.asiChoice !== 'asi') return false
        const total = Object.values(s.asiBonuses).reduce((a, b) => a + b, 0)
        return total === 2
      }

      case 'skills':
        return s.newSkills.length >= requiredMulticlassSkillPicks.value
          && newPickChoices.value.every(c => picksOf(c.progressionId).length === c.count)

      case 'spells':
        if (s.newCantripIds.length < requiredCantripPicks.value) return false
        if (s.newSpellIds.length < requiredSpellPicks.value) return false
        if (s.pactBoon === 'tome' && s.pactBoonCantripIds.length < 3) return false
        if (needsArcaneMysterium.value && s.arcaneMysteriumSpellId === null) return false
        if (s.bookOfAncientSecretsRequired && s.bookOfAncientSecretsSpellIds.length < 2) return false
        return true

      default:
        return false
    }
  })

  const canGoNext = computed(() => isStepComplete.value(currentStepId.value))

  // ── Step summaries ─────────────────────────────────────────────────────────

  const stepSummaries = computed<Record<string, string | null>>(() => {
    const s = state.value
    const cls = pickedClass.value
    return {
      class: cls
        ? `${cls.name}${s.isMulticlass ? ' (nouveau)' : ` niv.${s.toLevel}`}`
        : null,
      hp: hpGained.value != null ? `+${hpGained.value} PV` : null,
      features: s.newSubclassName ?? (s.pactBoon ? ({ chain: 'Pacte de la Chaîne', blade: 'Pacte de la Lame', tome: 'Pacte du Tome' })[s.pactBoon] : null) ?? (s.fightingStyle ? `Style: ${s.fightingStyle}` : null),
      asi: s.asiChoice === 'feat'
        ? (s.featureId != null ? 'don' : null)
        : (Object.values(s.asiBonuses).some(v => v > 0) ? '+2 carac.' : null),
      skills: s.newSkills.length > 0 ? `${s.newSkills.length} compétence(s)` : null,
      spells: (s.newCantripIds.length + s.newSpellIds.length) > 0
        ? `${s.newCantripIds.length + s.newSpellIds.length} sorts`
        : null,
    }
  })

  function goTo(stepId: string) {
    if (activeSteps.value.some(s => s.id === stepId)) {
      currentStepId.value = stepId
    }
  }

  function goNext() {
    if (!canGoNext.value || isLastStep.value) return
    currentStepId.value = activeSteps.value[currentIdx.value + 1]!.id
  }

  function goPrev() {
    if (!canGoPrev.value) return
    currentStepId.value = activeSteps.value[currentIdx.value - 1]!.id
  }

  function resetWizard() {
    state.value = freshState()
    currentStepId.value = 'class'
  }

  // Tous les choix en aval dépendent de la classe : en changer repart d'un état vierge.
  function selectClass(classId: string, fromLevel: number) {
    const s = state.value
    if (s.pickedClassId === classId && s.fromLevel === fromLevel) return
    state.value = { ...freshState(), pickedClassId: classId, isMulticlass: fromLevel === 0, fromLevel, toLevel: fromLevel + 1 }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function submit() {
    const id = charSheet.value?.id
    if (!id || !pickedClass.value) return

    const s = state.value

    // Classe déjà possédée : son dbClassId est connu ; en multiclasse, il faut le résoudre.
    const existingDbClassId = charClasses.value.find(c => c.classId === s.pickedClassId)?.dbClassId
    const classId = existingDbClassId ?? resolveClassId(pickedClass.value.dbName)
    if (!classId) {
      toast.add({
        title: 'Classe introuvable en base',
        description: `Aucune classe "${pickedClass.value.dbName}" en DB.`,
        color: 'error',
      })
      return
    }

    await $fetch(`/api/character_sheets/${id}/level-up`, {
      method: 'POST',
      body: {
        classId,
        isMulticlass: s.isMulticlass,
        hpGained: hpGained.value,
        subclassId: s.newSubclassId,
        fightingStyle: s.fightingStyle,
        expertiseSkills: s.expertiseSkills,
        asiChoice: s.asiChoice,
        asiBonuses: s.asiChoice === 'asi' ? s.asiBonuses : null,
        featureId: s.asiChoice === 'feat' ? s.featureId : null,
        featChoices: s.asiChoice === 'feat' ? buildFeatChoices(s) : null,
        newSkills: s.newSkills,
        choicePicks: newPickChoices.value.flatMap(c => picksOf(c.progressionId).map(v =>
          c.kind === 'cantrip' ? { progressionId: c.progressionId, spellId: v as number } : { progressionId: c.progressionId, value: v as string })),
        newCantripIds: s.newCantripIds,
        newSpellIds: s.newSpellIds,
        pactBoon: s.pactBoon,
        pactWeaponInventoryId: s.pactWeaponInventoryId,
        pactBoonCantripIds: s.pactBoonCantripIds,
        newInvocationIds: s.newInvocationIds,
        replacedInvocationId: s.replacedInvocationId,
        newMetamagicIds: s.newMetamagicIds,
        arcaneMysteriumSpellId: s.arcaneMysteriumSpellId,
        bookOfAncientSecretsSpellIds: s.bookOfAncientSecretsSpellIds,
      },
    })
  }

  return {
    // State
    state,
    // Character data
    charClasses,
    totalLevel,
    finalAbilities,
    conMod,
    expertSkills,
    proficientSkills,
    eligibleExpertiseSkills,
    ownedTools,
    knownLanguages,
    currentSpellIds,
    // Picked class
    pickedClass,
    pickedCharClass,
    // HP
    averageHpGain,
    hpGained,
    // Step conditions
    isSubclassLevel,
    subclassLevelFor,
    isAsiLevel,
    asiDueForClassLevel,
    needsFightingStyle,
    fightingStyleLevelFor,
    needsExpertise,
    newExpertiseCount,
    expertiseDueForClassLevel,
    needsMulticlassSkills,
    multiclassSkills,
    requiredMulticlassSkillPicks,
    newPickChoices,
    ownedFor,
    currentClassesPrerequisites,
    meetsCurrentClassesPrerequisites,
    multiclassPrerequisitesOf,
    meetsTargetPrerequisites,
    multiclassGainsOf,
    hasSpellcasting,
    spellLearning,
    cantripsToLearn,
    spellsToLearn,
    maxLearnableSpellLevel,
    classSpells,
    classSpellsPending,
    learnableCantrips,
    learnableSpells,
    requiredCantripPicks,
    requiredSpellPicks,
    needsPactBoon,
    needsInvocations,
    canReplaceInvocation,
    newInvocationsCount,
    knownInvocationIds,
    needsMetamagic,
    newMetamagicCount,
    knownMetamagicIds,
    effectivePactBoon,
    knownSpellNames,
    needsArcaneMysterium,
    arcaneMysteriumSpellLevel,
    picksBookOfAncientSecrets,
    // Navigation
    activeSteps,
    currentStepId,
    currentStep,
    currentIdx,
    isLastStep,
    canGoNext,
    canGoPrev,
    isStepComplete,
    stepSummaries,
    goTo,
    goNext,
    goPrev,
    resetWizard,
    selectClass,
    submit,
    featNeedsAbility,
    featNeedsSkilled,
    featLanguageCount,
    // Re-exports for step components
    CLASSES,
    ABILITIES,
    ABILITY_SHORT,
    ABILITY_LABELS,
    SKILLS,
    profBonusAtLevel,
    abilityMod,
    formatMod,
    spellSlotsAtLevel,
    toast,
  }
}
