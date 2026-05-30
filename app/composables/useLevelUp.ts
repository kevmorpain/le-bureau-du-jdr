import {
  CLASSES,
  ABILITIES,
  ABILITY_SHORT,
  ABILITY_LABELS,
  SKILLS,
  FIGHTING_STYLES,
  FIGHTING_STYLE_DESCRIPTIONS,
  spellSlotsAtLevel,
  CANTRIPS_KNOWN,
  SPELLS_KNOWN,
  profBonusAtLevel,
  abilityMod,
  formatMod,
  type AbilityKey,
} from '~/data/character-builder'
import type { CharacterSheet } from '~~/server/utils/drizzle'

// ─── D&D 5e 2014 Rule Data ────────────────────────────────────────────────────

export const LU_ASI_LEVELS: Record<string, number[]> = {
  fighter: [4, 6, 8, 12, 14, 16, 19],
  rogue: [4, 8, 10, 12, 16, 19],
}
const DEFAULT_ASI_LEVELS = [4, 8, 12, 16, 19]

export const LU_FIGHTING_STYLE_LEVELS: Record<string, number[]> = {
  fighter: [1, 10],
  paladin: [2],
  ranger: [2],
}

// Expertise: classId → levels that grant expertise (2 skills each time)
export const LU_EXPERTISE_LEVELS: Record<string, number[]> = {
  rogue: [1, 6],
  bard: [3, 10],
}

// Skills available for multiclass proficiency choices (null = any skill)
export const LU_MULTICLASS_SKILL_POOL: Record<string, string[] | null> = {
  bard: null,
  ranger: ['animalHandling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'],
  rogue: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'performance', 'persuasion', 'sleightOfHand', 'stealth'],
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

// La liste des dons est désormais servie par /api/feats (cf. useFeats). On
// expose seulement le type ici pour les consommateurs qui n'ont pas besoin de
// la liste complète.

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
  // Don choisi quand asiChoice='feat'. Référence directe à features.id du don.
  featureId: number | null
  // Choix de caractéristique +1 du don (Observateur/Résilient…) le cas échéant.
  featAbility: AbilityKey | null
  newSkills: string[]
  newCantripIds: number[]
  newSpellIds: number[]
  pactBoon: 'chain' | 'blade' | 'tome' | null
  pactWeaponInventoryId: number | null
  pactBoonCantripIds: number[]
  newInvocationIds: number[]
  replacedInvocationId: number | null
  // Sort choisi pour l'Arcane Mystérieux (niveau 11/13/15/17). Le niveau du sort
  // dépend du niveau d'occultiste atteint (cf. ARCANUM_SPELL_LEVEL_BY_LEVEL).
  arcaneMysteriumSpellId: number | null
  // Sorts rituels niv. 1 choisis quand on prend la manifestation
  // « Livre des secrets anciens » (2 sorts au choix de toute classe).
  bookOfAncientSecretsSpellIds: number[]
  // Flag positionné par le composant Magie quand l'invocation « Livre des anciens
  // secrets » est dans les choix de cette montée de niveau. Sert à valider le
  // step (2 sorts rituels obligatoires).
  bookOfAncientSecretsRequired: boolean
}

// Quel niveau de sort accorde l'Arcane Mystérieux à chaque palier (PHB 2014).
export const ARCANUM_SPELL_LEVEL_BY_LEVEL: Record<number, number> = {
  11: 6,
  13: 7,
  15: 8,
  17: 9,
}

// Nom canonique de l'invocation qui débloque la sélection de sorts rituels.
export const BOOK_OF_ANCIENT_SECRETS_NAME = 'Livre des secrets anciens'

// Invocations connues par niveau d'occultiste (PHB 2014)
// Index = warlockLevel - 1
export const WARLOCK_INVOCATIONS_KNOWN_LU = [0, 2, 2, 2, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8]

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
  newSkills: [],
  newCantripIds: [],
  newSpellIds: [],
  pactBoon: null,
  pactWeaponInventoryId: null,
  pactBoonCantripIds: [],
  newInvocationIds: [],
  replacedInvocationId: null,
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

  // Dons : la liste vient de /api/feats (useFeats). Sert à savoir si le don
  // choisi exige un choix de caractéristique (ability_increase_choice).
  const { getById: getFeatById } = useFeats()
  const featNeedsAbility = (featureId: number | null): boolean => {
    if (featureId == null) return false
    return (getFeatById(featureId)?.effects ?? []).some((e: any) => e.type === 'ability_increase_choice')
  }

  // ── Derived character data ─────────────────────────────────────────────────

  // Map character classes to usable objects with frontend class data
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

  // Final ability scores (base + ASI improvements)
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

  // Current expert skills from character sheet
  const expertSkills = computed<string[]>(() => {
    return (charSheet.value?.skills ?? [])
      .filter((s: any) => s.proficiencyLevel === 'expert')
      .map((s: any) => s.skillKey)
  })

  // Current proficient skills
  const proficientSkills = computed<string[]>(() => {
    return (charSheet.value?.skills ?? [])
      .filter((s: any) => s.proficiencyLevel === 'proficient' || s.proficiencyLevel === 'expert')
      .map((s: any) => s.skillKey)
  })

  // Current spell IDs
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

  // CON modifier
  const conMod = computed(() => abilityMod(finalAbilities.value.con))

  // HP per level if using average method
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

  // ── Pact Boon availability (Warlock level 3) ──────────────────────────────

  const needsPactBoon = computed(() => {
    if (state.value.pickedClassId !== 'warlock') return false
    if (state.value.toLevel !== 3) return false
    const existingPactBoon = (pickedCharClass.value as any)?.pactBoon ?? null
    return !existingPactBoon
  })

  // ── Manifestations occultes (Warlock niveaux 2/5/7/9/12/15/18) ─────────────

  const invocationsAtToLevel = computed(() => {
    if (state.value.pickedClassId !== 'warlock') return 0
    return WARLOCK_INVOCATIONS_KNOWN_LU[state.value.toLevel - 1] ?? 0
  })
  const invocationsAtFromLevel = computed(() => {
    if (state.value.pickedClassId !== 'warlock') return 0
    return WARLOCK_INVOCATIONS_KNOWN_LU[state.value.fromLevel - 1] ?? 0
  })
  const newInvocationsCount = computed(() =>
    Math.max(0, invocationsAtToLevel.value - invocationsAtFromLevel.value),
  )

  const needsInvocations = computed(() => newInvocationsCount.value > 0)
  const canReplaceInvocation = computed(() =>
    state.value.pickedClassId === 'warlock'
    && !state.value.isMulticlass
    && invocationsAtFromLevel.value > 0,
  )

  // Current invocation IDs known by the character (warlock features with featureType=eldritch_invocation)
  const knownInvocationIds = computed<number[]>(() => {
    const features = (charSheet.value as any)?.features ?? []
    return features
      .filter((f: any) => f.feature?.featureType === 'eldritch_invocation')
      .map((f: any) => f.feature.id)
  })

  // Effective pact boon (for filtering invocations) — existing on charClass OR being picked this level-up
  const effectivePactBoon = computed<'chain' | 'blade' | 'tome' | null>(() => {
    return ((pickedCharClass.value as any)?.pactBoon ?? null) ?? state.value.pactBoon
  })

  // Known spell names (for prereq Décharge occulte etc.)
  const knownSpellNames = computed<string[]>(() => {
    const spells = (charSheet.value?.spells ?? []) as any[]
    return spells.map(s => s.spell?.name ?? '').filter(Boolean)
  })

  // ── Arcane Mystérieux (Occultiste niveaux 11 / 13 / 15 / 17) ───────────────

  const arcaneMysteriumSpellLevel = computed<number | null>(() => {
    if (state.value.pickedClassId !== 'warlock') return null
    return ARCANUM_SPELL_LEVEL_BY_LEVEL[state.value.toLevel] ?? null
  })
  const needsArcaneMysterium = computed(() => arcaneMysteriumSpellLevel.value !== null)

  // ── Livre des anciens secrets — sorts rituels (manifestation TCoE) ─────────

  // L'ID de l'invocation est résolu côté UI via /api/invocations (cf. composant Magie).
  // Le composable expose juste l'aide pour savoir « est-ce que cette manifestation
  // figure dans les invocations nouvellement choisies ? »
  const picksBookOfAncientSecrets = (allInvocationsByName: Record<string, number>) => {
    const id = allInvocationsByName[BOOK_OF_ANCIENT_SECRETS_NAME]
    if (!id) return false
    return state.value.newInvocationIds.includes(id)
  }

  // ── Subclass availability ─────────────────────────────────────────────────

  const isSubclassLevel = computed(() => {
    const cls = pickedClass.value
    if (!cls) return false
    // For existing class: don't show if already has subclass
    if (!state.value.isMulticlass && pickedCharClass.value?.subclassName) return false
    return state.value.toLevel === cls.subclassLevel
  })

  // ── Step visibility ────────────────────────────────────────────────────────

  const isAsiLevel = computed(() => {
    const clsId = state.value.pickedClassId
    if (!clsId) return false
    const levels = LU_ASI_LEVELS[clsId] ?? DEFAULT_ASI_LEVELS
    return levels.includes(state.value.toLevel)
  })

  const needsFightingStyle = computed(() => {
    const clsId = state.value.pickedClassId
    if (!clsId) return false
    const levels = LU_FIGHTING_STYLE_LEVELS[clsId] ?? []
    return levels.includes(state.value.toLevel)
  })

  const needsExpertise = computed(() => {
    const clsId = state.value.pickedClassId
    if (!clsId) return false
    return (LU_EXPERTISE_LEVELS[clsId] ?? []).includes(state.value.toLevel)
  })

  const needsMulticlassSkills = computed(() => {
    if (!state.value.isMulticlass) return false
    const clsId = state.value.pickedClassId
    return clsId ? (LU_MULTICLASS_SKILL_COUNT[clsId] ?? 0) > 0 : false
  })

  const hasSpellcasting = computed(() => {
    if (!pickedClass.value?.spellcasting) return false
    // For half-casters, spells start at level 2
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
        if (needsExpertise.value && s.expertiseSkills.length < 2) return false
        if (needsPactBoon.value && !s.pactBoon) return false
        const expectedInvocations = newInvocationsCount.value + (s.replacedInvocationId ? 1 : 0)
        if (expectedInvocations > 0 && s.newInvocationIds.length < expectedInvocations) return false
        return true
      }

      case 'asi': {
        if (s.asiChoice === 'feat') {
          if (s.featureId == null) return false
          // Si le don exige un choix de caractéristique, il doit être fait.
          if (featNeedsAbility(s.featureId) && !s.featAbility) return false
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
        // L'Arcane Mystérieux exige un sort du niveau correspondant.
        if (needsArcaneMysterium.value && s.arcaneMysteriumSpellId === null) return false
        // Livre des anciens secrets : 2 sorts rituels niv. 1 obligatoires.
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
      // Affichage du nom du don dans le résumé — résolu via useFeats côté UI.
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
    const { resolveClassId } = useBuilderEntities()

    // Résolution dbName → classId. Pour les classes existantes du perso, on
    // peut prendre le dbClassId directement depuis charClasses ; pour un
    // multiclasse, il faut résoudre via /api/classes.
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
        // Au niveau de pick de sous-classe, on a déjà l'ID via les radios.
        subclassId: s.newSubclassId,
        fightingStyle: s.fightingStyle,
        expertiseSkills: s.expertiseSkills,
        asiChoice: s.asiChoice,
        asiBonuses: s.asiChoice === 'asi' ? s.asiBonuses : null,
        featureId: s.asiChoice === 'feat' ? s.featureId : null,
        featChoices: s.asiChoice === 'feat' && s.featAbility ? { ability: s.featAbility } : null,
        newSkills: s.newSkills,
        newCantripIds: s.newCantripIds,
        newSpellIds: s.newSpellIds,
        pactBoon: s.pactBoon,
        pactWeaponInventoryId: s.pactWeaponInventoryId,
        pactBoonCantripIds: s.pactBoonCantripIds,
        newInvocationIds: s.newInvocationIds,
        replacedInvocationId: s.replacedInvocationId,
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
    currentSpellIds,
    // Picked class
    pickedClass,
    pickedCharClass,
    // HP
    averageHpGain,
    computedHpGained,
    // Step conditions
    isSubclassLevel,
    isAsiLevel,
    needsFightingStyle,
    needsExpertise,
    needsMulticlassSkills,
    hasSpellcasting,
    needsPactBoon,
    needsInvocations,
    canReplaceInvocation,
    newInvocationsCount,
    knownInvocationIds,
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
    // Re-exports for step components
    CLASSES,
    ABILITIES,
    ABILITY_SHORT,
    ABILITY_LABELS,
    SKILLS,
    FIGHTING_STYLES,
    FIGHTING_STYLE_DESCRIPTIONS,
    profBonusAtLevel,
    abilityMod,
    formatMod,
    spellSlotsAtLevel,
    CANTRIPS_KNOWN,
    SPELLS_KNOWN,
    toast,
  }
}
