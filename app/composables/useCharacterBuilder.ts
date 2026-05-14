import {
  RACES,
  CLASSES,
  BACKGROUNDS,
  ALIGNMENTS,
  DRAGON_ANCESTRY,
  ABILITIES,
  ABILITY_SHORT,
  SKILLS,
  FIGHTING_STYLES,
  abilityMod,
  formatMod,
  profBonusAtLevel,
  hpAtLevel,
  spellSlotsAtLevel,
  maxSpellLevelAtLevel,
  CANTRIPS_KNOWN,
  SPELLS_KNOWN,
  type AbilityKey,
} from '~/data/character-builder'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BuilderState {
  // Étape 1 — Race
  raceId: string | null
  isVariantHuman: boolean
  subraceId: string | null
  halfElfBonuses: AbilityKey[]
  variantHumanBonuses: AbilityKey[]
  variantHumanSkill: string | null
  dragonAncestry: string | null

  // Étape 2 — Classe
  classId: string | null
  subclass: string | null
  skills: string[]
  level: number
  fightingStyle: string | null
  hpMode: 'average' | 'roll' | 'manual'
  hpRolled: number[] | null   // jets pour niveaux 2+ (longueur = level - 1)
  hpManual: number | null

  // Étape 3 — Caractéristiques
  abilityMethod: 'standard' | 'pointbuy' | 'roll'
  abilities: Partial<Record<AbilityKey, number | null>>
  abilityAssigns: Partial<Record<AbilityKey, number>>
  pbScores: Record<AbilityKey, number>
  rolledSets: { dice: number[], total: number }[] | null

  // Étape 4 — Sorts
  selectedCantrips: number[]
  selectedSpells: number[]

  // Étape 5 — Description
  name: string
  backgroundId: string | null
  alignment: string | null
  personality: string
  ideals: string
  bonds: string
  flaws: string

  // Étape 6 — Équipement
  equipChoices: (string | null)[]
  equipment: string[]
}

const INIT_STATE: BuilderState = {
  raceId: null,
  isVariantHuman: false,
  subraceId: null,
  halfElfBonuses: [],
  variantHumanBonuses: [],
  variantHumanSkill: null,
  dragonAncestry: null,
  classId: null,
  subclass: null,
  skills: [],
  level: 1,
  fightingStyle: null,
  hpMode: 'average',
  hpRolled: null,
  hpManual: null,
  abilityMethod: 'standard',
  abilities: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
  abilityAssigns: {},
  pbScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  rolledSets: null,
  selectedCantrips: [],
  selectedSpells: [],
  name: '',
  backgroundId: null,
  alignment: null,
  personality: '',
  ideals: '',
  bonds: '',
  flaws: '',
  equipChoices: [],
  equipment: [],
}

// ─── Étapes ───────────────────────────────────────────────────────────────────

export interface BuilderStep {
  id: string
  label: string
  icon: string
}

const ALL_STEPS: BuilderStep[] = [
  { id: 'race', label: 'Race', icon: 'i-game-icons:dragon-head' },
  { id: 'class', label: 'Classe', icon: 'i-game-icons:sword' },
  { id: 'abilities', label: 'Carac.', icon: 'i-game-icons:muscle-up' },
  { id: 'spells', label: 'Sorts', icon: 'i-game-icons:spell-book' },
  { id: 'description', label: 'Description', icon: 'i-heroicons:document-text' },
  { id: 'equipment', label: 'Équipement', icon: 'i-game-icons:backpack' },
]

const LS_KEY = 'character-builder-state'

// ─── Composable ───────────────────────────────────────────────────────────────

export function useCharacterBuilder() {
  const state = useState<BuilderState>('character-builder', () => {
    if (import.meta.client) {
      try {
        const saved = localStorage.getItem(LS_KEY)
        if (saved) return JSON.parse(saved) as BuilderState
      }
      catch {}
    }
    return { ...INIT_STATE }
  })

  // Persist to localStorage on every change (client-side only)
  if (import.meta.client) {
    watch(state, (val) => {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(val))
      }
      catch {}
    }, { deep: true })
  }

  // ─── Données dérivées ────────────────────────────────────────────────────────

  const raceData = computed(() => RACES.find(r => r.id === state.value.raceId) ?? null)
  const subraceData = computed(() => {
    if (!state.value.subraceId) return null
    return raceData.value?.subraces?.find(s => s.id === state.value.subraceId) ?? null
  })
  const classData = computed(() => CLASSES.find(c => c.id === state.value.classId) ?? null)
  const backgroundData = computed(() => BACKGROUNDS.find(b => b.id === state.value.backgroundId) ?? null)
  const alignmentData = computed(() => ALIGNMENTS.find(a => a.id === state.value.alignment) ?? null)

  // Bonus raciaux fusionnés (race + sous-race + cas spéciaux)
  const raceBonuses = computed<Partial<Record<AbilityKey, number>>>(() => {
    const bonuses: Partial<Record<AbilityKey, number>> = {}
    const addBonus = (k: AbilityKey, v: number) => {
      bonuses[k] = (bonuses[k] ?? 0) + v
    }

    const race = raceData.value
    if (!race) return bonuses

    // Bonus de la race de base (sauf si sous-race override)
    const hasSub = !!subraceData.value
    if (!hasSub || race.id === 'half-elf') {
      // Pour les races sans sous-races, appliquer les bonus de la race
      // Pour demi-elfe, les bonus de race s'appliquent toujours (+2 CHA)
      for (const [k, v] of Object.entries(race.abilityBonuses) as [AbilityKey, number][]) {
        addBonus(k, v)
      }
    }

    // Bonus de la sous-race (incluent les bonus parentaux pour les races avec subraces)
    if (subraceData.value) {
      for (const [k, v] of Object.entries(subraceData.value.abilityBonuses) as [AbilityKey, number][]) {
        addBonus(k, v)
      }
    }

    // Cas spéciaux
    if (race.id === 'half-elf') {
      for (const ab of state.value.halfElfBonuses) {
        addBonus(ab as AbilityKey, 1)
      }
    }
    if (race.id === 'human' && state.value.isVariantHuman) {
      // Variante : remplace les +1 universels par +1+1 au choix
      // On retire d'abord les +1 universels déjà ajoutés
      for (const k of ABILITIES) bonuses[k] = 0
      for (const ab of state.value.variantHumanBonuses) {
        addBonus(ab as AbilityKey, 1)
      }
    }

    return bonuses
  })

  // Scores finaux (base + racial)
  const finalAbilities = computed<Partial<Record<AbilityKey, number>>>(() => {
    const result: Partial<Record<AbilityKey, number>> = {}
    for (const ab of ABILITIES) {
      const base = state.value.abilities[ab]
      if (base != null) {
        result[ab] = base + (raceBonuses.value[ab] ?? 0)
      }
    }
    return result
  })

  const hasAbilities = computed(() => ABILITIES.some(ab => finalAbilities.value[ab] != null))

  // Stats dérivées
  const level = computed(() => state.value.level)
  const profBonus = computed(() => profBonusAtLevel(level.value))

  const speed = computed(() => {
    if (subraceData.value?.speed) return subraceData.value.speed
    return raceData.value?.speed ?? 9
  })

  const hpMax = computed(() => {
    if (!classData.value) return null
    const con = finalAbilities.value.con
    if (con == null) return null
    const conMod = abilityMod(con)
    const { hitDie } = classData.value
    const s = state.value

    if (s.hpMode === 'manual' && s.hpManual != null) return s.hpManual

    if (s.hpMode === 'roll' && s.hpRolled != null) {
      const rolled = s.hpRolled.slice(0, level.value - 1)
      return hitDie + conMod + rolled.reduce((sum, v) => sum + v + conMod, 0)
    }

    return hpAtLevel(hitDie, level.value, conMod)
  })

  const baseAC = computed(() => {
    const dex = finalAbilities.value.dex
    return 10 + (dex != null ? abilityMod(dex) : 0)
  })

  const passivePerception = computed(() => {
    const wis = finalAbilities.value.wis
    const wisBonus = wis != null ? abilityMod(wis) : 0
    const allSkills = [...state.value.skills, ...(backgroundData.value?.skillProficiencies ?? [])]
    const hasPerception = allSkills.includes('perception')
    return 10 + wisBonus + (hasPerception ? profBonus.value : 0)
  })

  const initiative = computed(() => {
    const dex = finalAbilities.value.dex
    return dex != null ? abilityMod(dex) : 0
  })

  // Sorts
  const spellcastingInfo = computed(() => classData.value?.spellcasting ?? null)
  const spellSlots = computed(() => {
    if (!spellcastingInfo.value) return null
    return spellSlotsAtLevel(spellcastingInfo.value.type, level.value)
  })
  const maxSpellLevel = computed(() => {
    if (!spellcastingInfo.value) return 0
    return maxSpellLevelAtLevel(spellcastingInfo.value.type, level.value)
  })
  const cantripsNeeded = computed(() => {
    if (!classData.value?.id) return 0
    return CANTRIPS_KNOWN[classData.value.id]?.[level.value - 1] ?? 0
  })

  // ─── Étapes actives ───────────────────────────────────────────────────────────

  const activeSteps = computed<BuilderStep[]>(() => {
    return ALL_STEPS.filter(s => {
      if (s.id !== 'spells') return true
      return !!classData.value?.spellcasting
    })
  })

  // ─── Validation des étapes ────────────────────────────────────────────────────

  const isStepComplete = computed(() => (stepId: string): boolean => {
    const s = state.value
    switch (stepId) {
      case 'race': {
        if (!s.raceId) return false
        const race = raceData.value
        if (race?.subraces?.length && !s.subraceId) return false
        if (s.raceId === 'half-elf' && s.halfElfBonuses.length < 2) return false
        if (s.raceId === 'dragonborn' && !s.dragonAncestry) return false
        if (s.raceId === 'human' && s.isVariantHuman) {
          if (s.variantHumanBonuses.length < 2 || !s.variantHumanSkill) return false
        }
        return true
      }
      case 'class': {
        if (!s.classId) return false
        const cls = classData.value
        if (!cls) return false
        if (s.skills.length < cls.skillChoices.count) return false
        const fightingStyleOptions = FIGHTING_STYLES[s.classId]
        if (fightingStyleOptions && !s.fightingStyle) return false
        return true
      }
      case 'abilities': {
        return ABILITIES.every(ab => s.abilities[ab] != null)
      }
      case 'spells': {
        const cls = classData.value
        if (!cls?.spellcasting) return true
        const cantripsDone = cantripsNeeded.value === 0 || s.selectedCantrips.length >= cantripsNeeded.value
        // Pour les sorts : si classe préparée, pas de validation stricte
        const preparedCasters = ['cleric', 'druid', 'paladin', 'ranger', 'wizard']
        if (preparedCasters.includes(s.classId ?? '')) return cantripsDone
        const spellsNeeded = SPELLS_KNOWN[s.classId ?? '']?.[level.value - 1] ?? 0
        const spellsDone = spellsNeeded === 0 || s.selectedSpells.length >= spellsNeeded
        return cantripsDone && spellsDone
      }
      case 'description': {
        return s.name.trim().length >= 1 && !!s.backgroundId && !!s.alignment
      }
      case 'equipment': {
        return s.equipment.length > 0
      }
      default:
        return false
    }
  })

  // ─── Navigation ───────────────────────────────────────────────────────────────

  const currentStepId = useState<string>('character-builder-step', () => 'race')

  const currentIdx = computed(() =>
    activeSteps.value.findIndex(s => s.id === currentStepId.value),
  )
  const currentStep = computed(() => activeSteps.value[currentIdx.value] ?? null)
  const canGoNext = computed(() => isStepComplete.value(currentStepId.value))
  const canGoPrev = computed(() => currentIdx.value > 0)
  const isLastStep = computed(() => currentIdx.value === activeSteps.value.length - 1)

  function goTo(stepId: string) {
    if (activeSteps.value.some(s => s.id === stepId)) {
      currentStepId.value = stepId
    }
  }

  function goNext() {
    if (!canGoNext.value) return
    if (isLastStep.value) return
    currentStepId.value = activeSteps.value[currentIdx.value + 1]!.id
  }

  function goPrev() {
    if (!canGoPrev.value) return
    currentStepId.value = activeSteps.value[currentIdx.value - 1]!.id
  }

  // ─── Résumé sidebar ───────────────────────────────────────────────────────────

  const stepSummaries = computed<Record<string, string | null>>(() => {
    const s = state.value
    const raceName = subraceData.value ? subraceData.value.name : raceData.value?.name
    const className = classData.value?.name
    const bgName = backgroundData.value?.name

    const abilitiesDone = ABILITIES.filter(ab => s.abilities[ab] != null).length
    const cantripCount = s.selectedCantrips.length
    const spellCount = s.selectedSpells.length

    return {
      race: raceName ?? null,
      class: className ? `${className} niv.${s.level}` : null,
      abilities: abilitiesDone === 6 ? 'Assignées ✓' : `${abilitiesDone}/6 assignées`,
      spells: cantripCount + spellCount > 0 ? `${cantripCount + spellCount} sorts` : null,
      description: s.name.trim() || null,
      equipment: s.equipment.length > 0 ? `${s.equipment.length} objets` : null,
    }
  })

  // ─── Reset ────────────────────────────────────────────────────────────────────

  function resetBuilder() {
    state.value = { ...INIT_STATE }
    currentStepId.value = 'race'
    if (import.meta.client) {
      try { localStorage.removeItem(LS_KEY) }
      catch {}
    }
  }

  // ─── Exports ──────────────────────────────────────────────────────────────────

  return {
    // State
    state,
    // Data dérivée
    raceData,
    subraceData,
    classData,
    backgroundData,
    alignmentData,
    raceBonuses,
    finalAbilities,
    hasAbilities,
    // Stats
    level,
    profBonus,
    speed,
    hpMax,
    baseAC,
    passivePerception,
    initiative,
    // Sorts
    spellcastingInfo,
    spellSlots,
    maxSpellLevel,
    cantripsNeeded,
    // Navigation
    activeSteps,
    currentStepId,
    currentIdx,
    currentStep,
    canGoNext,
    canGoPrev,
    isLastStep,
    isStepComplete,
    stepSummaries,
    goTo,
    goNext,
    goPrev,
    resetBuilder,
    // Constantes utiles
    ABILITIES,
    ABILITY_SHORT,
    SKILLS,
    DRAGON_ANCESTRY,
    RACES,
    CLASSES,
    BACKGROUNDS,
    ALIGNMENTS,
    // Utilitaires
    abilityMod,
    formatMod,
    profBonusAtLevel,
  }
}
