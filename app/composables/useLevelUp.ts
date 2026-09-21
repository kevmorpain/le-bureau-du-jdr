import {
  CLASSES,
  ABILITIES,
  ABILITY_SHORT,
  ABILITY_LABELS,
  SKILLS,
  spellSlotsAtLevel,
  CANTRIPS_KNOWN,
  SPELLS_KNOWN,
  profBonusAtLevel,
  abilityMod,
  formatMod,
  type AbilityKey,
} from '~/data/character-builder'
import { SKILLED_FEAT_COUNT } from '~~/shared/rules/tools'
import type { CharacterSheet } from '~~/server/utils/drizzle'
import type { Effect } from '~~/server/db/schema/effects'

// ─── D&D 5e 2014 Rule Data ────────────────────────────────────────────────────

// Skills available for multiclass proficiency choices (null = any skill)
export const LU_MULTICLASS_SKILL_POOL: Record<string, string[] | null> = {
  bard: null,
  ranger: ['animal_handling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'],
  rogue: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'performance', 'persuasion', 'sleight_of_hand', 'stealth'],
}

export const LU_MULTICLASS_SKILL_COUNT: Record<string, number> = {
  bard: 1, ranger: 1, rogue: 1,
}

export const LU_MULTICLASS_PREREQS: Record<string, { or?: Array<Partial<Record<AbilityKey, number>>>, [key: string]: any }> = {
  barbarian: { str: 13 },
  bard: { cha: 13 },
  cleric: { wis: 13 },
  druid: { wis: 13 },
  fighter: { or: [{ str: 13 }, { dex: 13 }] },
  monk: { dex: 13, wis: 13 },
  paladin: { str: 13, cha: 13 },
  ranger: { dex: 13, wis: 13 },
  rogue: { dex: 13 },
  sorcerer: { cha: 13 },
  warlock: { cha: 13 },
  wizard: { int: 13 },
}

export const LU_MULTICLASS_PROFICIENCIES: Record<string, string[]> = {
  barbarian: ['Boucliers', 'Armes courantes', 'Armes de guerre'],
  bard: ['Armures légères', '1 compétence au choix', '1 instrument de musique'],
  cleric: ['Armures légères', 'Armures intermédiaires', 'Boucliers'],
  druid: ['Armures légères', 'Armures intermédiaires (non-métal)', 'Boucliers (non-métal)'],
  fighter: ['Armures légères', 'Armures intermédiaires', 'Boucliers', 'Armes courantes', 'Armes de guerre'],
  monk: ['Armes courantes', 'Épées courtes'],
  paladin: ['Armures légères', 'Armures intermédiaires', 'Boucliers', 'Armes courantes', 'Armes de guerre'],
  ranger: ['Armures légères', 'Armures intermédiaires', 'Boucliers', 'Armes courantes', 'Armes de guerre', '1 compétence'],
  rogue: ['Armures légères', '1 compétence au choix', 'Outils de voleur'],
  sorcerer: [],
  warlock: ['Armures légères', 'Armes courantes'],
  wizard: [],
}

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
  hpGained: number | null
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
  newSkills: string[]
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
  hpGained: null,
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
  newSkills: [],
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
  { id: 'skills', label: 'Compétences', icon: 'i-heroicons:academic-cap' },
  { id: 'spells', label: 'Magie', icon: 'i-game-icons:spell-book' },
]

// ─── Extended character type (includes abilityScoreImprovements from GET) ─────

export type CharacterSheetWithASI = CharacterSheet & {
  abilityScoreImprovements?: Array<{ ability: AbilityKey, amount: number, classId: number, classLevel: number }>
}

// ─── Composable ───────────────────────────────────────────────────────────────

export function useLevelUp(charSheet: Ref<CharacterSheetWithASI | null>) {
  const state = useState<LevelUpState>('level-up-state', () => ({ ...INIT_STATE }))
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
  const buildFeatChoices = (s: LevelUpState): { ability?: AbilityKey, skills?: string[], tools?: string[] } | null => {
    if (s.featureId == null) return null
    if (featNeedsSkilled(s.featureId)) return { skills: s.featSkills, tools: s.featTools }
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

  const finalAbilities = computed<Record<AbilityKey, number>>(() => {
    const base: Record<AbilityKey, number> = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
    for (const score of charSheet.value?.baseAbilityScores ?? []) {
      const key = (score as any).abilityId as AbilityKey
      if (key in base) base[key] = (score as any).value
    }
    for (const imp of charSheet.value?.abilityScoreImprovements ?? []) {
      const key = imp.ability
      if (key in base) base[key] += imp.amount
    }
    return base
  })

  const expertSkills = computed<string[]>(() => {
    return (charSheet.value?.skills ?? [])
      .filter((s: any) => s.proficiencyLevel === 'expert')
      .map((s: any) => s.skillKey)
  })

  const proficientSkills = computed<string[]>(() => {
    return (charSheet.value?.skills ?? [])
      .filter((s: any) => s.proficiencyLevel === 'proficient' || s.proficiencyLevel === 'expert')
      .map((s: any) => s.skillKey)
  })

  // Maîtrises DÉRIVÉES portées par la fiche GET (F3 : historique + compétences de classe + JS ne sont
  // plus matérialisés en character_skills). Les octrois d'espèce/dons imbriqués n'y sont pas (rares).
  const derivedProficiencyEffects = computed<Effect[]>(() => {
    const s = charSheet.value as any
    if (!s) return []
    return [...(s.backgroundEffects ?? []), ...(s.classEffects ?? []), ...(s.classSkillEffects ?? [])] as Effect[]
  })
  // Outils choisis (ex. « Outils de voleur » d'un historique) : stockés en overrides, ABSENTS du payload
  // GET → fetch dédié (comme la fiche). Sert à exclure du picker Doué.
  const { data: proficiencyOverridesData } = useFetch<Array<{ proficiencyType: string, value: string, action: string }>>(
    () => (charSheet.value?.id != null ? `/api/character_sheets/${charSheet.value.id}/proficiency-overrides` : null),
    { default: () => [] },
  )

  // Compétences maîtrisées COMPLÈTES (stockées + dérivées) : exclues du picker Doué. Distinct de
  // `proficientSkills` (stocké seul, conservé tel quel pour l'éligibilité expertise).
  const ownedSkills = computed<string[]>(() => {
    const derived = derivedProficiencyEffects.value
      .filter(e => e.type === 'skill_proficiency')
      .map(e => (e.value as { skill: string }).skill)
    return [...new Set([...proficientSkills.value, ...derived])]
  })
  const ownedTools = computed<string[]>(() => {
    const fromEffects = derivedProficiencyEffects.value.filter(e => e.type === 'tool_proficiency').map(e => e.value as string)
    const ov = proficiencyOverridesData.value ?? []
    const grants = ov.filter(o => o.proficiencyType === 'tool' && o.action === 'grant').map(o => o.value)
    const revokes = new Set(ov.filter(o => o.proficiencyType === 'tool' && o.action === 'revoke').map(o => o.value))
    return [...new Set([...fromEffects, ...grants])].filter(t => !revokes.has(t))
  })

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

  const computedHpGained = computed(() => {
    const s = state.value
    if (s.hpMethod === 'average') return averageHpGain.value
    if (s.hpMethod === 'manual' && s.hpManual != null) return Math.max(1, s.hpManual + conMod.value)
    if (s.hpMethod === 'roll' && s.hpRolled != null) return Math.max(1, s.hpRolled + conMod.value)
    return null
  })

  watch(computedHpGained, (val) => {
    if (val != null) state.value.hpGained = val
  })

  // ── Choix de progression lus dans le CATALOGUE (/api/catalog, lot 6a) ──────
  // Choix résolus aux niveaux d'ARRIVÉE et de DÉPART : le delta pilote le nombre de nouvelles
  // invocations et compétences d'expertise.
  const { choicesForClassLevel } = useCatalog()
  const { resolveClassId, subclassCatalogFor } = useBuilderEntities()
  const luClassDbId = computed(() =>
    charClasses.value.find(c => c.classId === state.value.pickedClassId)?.dbClassId
    ?? resolveClassId(pickedClass.value?.dbName),
  )
  const choicesAtToLevel = computed(() => choicesForClassLevel(luClassDbId.value, state.value.toLevel))
  const choicesAtFromLevel = computed(() => choicesForClassLevel(luClassDbId.value, state.value.fromLevel))

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

  const needsMulticlassSkills = computed(() => {
    if (!state.value.isMulticlass) return false
    const clsId = state.value.pickedClassId
    return clsId ? (LU_MULTICLASS_SKILL_COUNT[clsId] ?? 0) > 0 : false
  })

  const hasSpellcasting = computed(() => {
    if (!pickedClass.value?.spellcasting) return false
    const startsAt = pickedClass.value.spellcasting.startsAtLevel ?? 1
    return state.value.toLevel >= startsAt
  })

  // ── Active steps ───────────────────────────────────────────────────────────

  const activeSteps = computed(() => ALL_LU_STEPS.filter(s => {
    if (s.id === 'asi') return isAsiLevel.value
    if (s.id === 'skills') return needsMulticlassSkills.value
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
        return s.hpGained != null && s.hpGained > 0

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
          return true
        }
        if (s.asiChoice !== 'asi') return false
        const total = Object.values(s.asiBonuses).reduce((a, b) => a + b, 0)
        return total === 2
      }

      case 'skills': {
        const clsId = s.pickedClassId
        if (!clsId) return true
        const needed = LU_MULTICLASS_SKILL_COUNT[clsId] ?? 0
        return s.newSkills.length >= needed
      }

      case 'spells':
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
      hp: s.hpGained != null ? `+${s.hpGained} PV` : null,
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
    state.value = { ...INIT_STATE }
    currentStepId.value = 'class'
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
        hpGained: s.hpGained,
        subclassId: s.newSubclassId,
        fightingStyle: s.fightingStyle,
        expertiseSkills: s.expertiseSkills,
        asiChoice: s.asiChoice,
        asiBonuses: s.asiChoice === 'asi' ? s.asiBonuses : null,
        featureId: s.asiChoice === 'feat' ? s.featureId : null,
        featChoices: s.asiChoice === 'feat' ? buildFeatChoices(s) : null,
        newSkills: s.newSkills,
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
    ownedSkills,
    ownedTools,
    currentSpellIds,
    // Picked class
    pickedClass,
    pickedCharClass,
    // HP
    averageHpGain,
    computedHpGained,
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
    hasSpellcasting,
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
    submit,
    featNeedsAbility,
    featNeedsSkilled,
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
    CANTRIPS_KNOWN,
    SPELLS_KNOWN,
    toast,
  }
}
