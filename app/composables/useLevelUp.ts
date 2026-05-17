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

export const LU_FEATS = [
  { id: 'alert', name: 'Alerte', desc: '+5 init., ne peut être surpris quand conscient.' },
  { id: 'athlete', name: 'Athlète', desc: '+1 FOR ou DEX. Se lever ne coûte que 1,5 m.' },
  { id: 'great-weapon', name: 'Maître d\'armes de guerre', desc: 'Critique → attaque bonus avec la même arme.' },
  { id: 'lucky', name: 'Chanceux', desc: '3 points de chance / repos long. Relancer un d20.' },
  { id: 'mage-slayer', name: 'Tueur de mages', desc: 'Réaction : attaque quand un mage à 1,5m lance un sort.' },
  { id: 'mobile', name: 'Mobile', desc: '+3 m de vitesse. Pas de désavantage difficile après course.' },
  { id: 'resilient', name: 'Résilient', desc: '+1 à une caractéristique. Maîtrise du JS correspondant.' },
  { id: 'sentinel', name: 'Sentinelle', desc: 'Coup d\'opportunisme → vitesse 0.' },
  { id: 'sharpshooter', name: 'Tireur d\'élite', desc: 'Ignore le couvert ¾. −5 atk / +10 dégâts.' },
  { id: 'tough', name: 'Robuste', desc: '+2 PV par niveau (rétroactif).' },
  { id: 'war-caster', name: 'Mage de guerre', desc: 'Avantage aux JS de concentration.' },
  { id: 'magic-init', name: 'Initié à la magie', desc: '2 tours de magie + 1 sort niv. 1 (1×/repos long).' },
]

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
  featId: string | null
  newSkills: string[]
  newCantripIds: number[]
  newSpellIds: number[]
}

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
  featId: null,
  newSkills: [],
  newCantripIds: [],
  newSpellIds: [],
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
        return true
      }

      case 'asi': {
        if (s.asiChoice === 'feat') return !!s.featId
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
        return true  // optional: don't block on spell selection

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
      features: s.newSubclassName ?? (s.fightingStyle ? `Style: ${s.fightingStyle}` : null),
      asi: s.asiChoice === 'feat'
        ? (LU_FEATS.find(f => f.id === s.featId)?.name ?? null)
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
    await $fetch(`/api/character_sheets/${id}/level-up`, {
      method: 'POST',
      body: {
        classDbName: pickedClass.value.dbName,
        isMulticlass: s.isMulticlass,
        hpGained: s.hpGained,
        subclassName: s.newSubclassName,
        fightingStyle: s.fightingStyle,
        expertiseSkills: s.expertiseSkills,
        asiChoice: s.asiChoice,
        asiBonuses: s.asiChoice === 'asi' ? s.asiBonuses : null,
        featId: s.asiChoice === 'feat' ? s.featId : null,
        newSkills: s.newSkills,
        newCantripIds: s.newCantripIds,
        newSpellIds: s.newSpellIds,
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
