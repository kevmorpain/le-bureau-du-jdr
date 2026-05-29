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
  LANGUAGES,
  TOOL_CHOICE_MAP,
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

  // Langues choisies
  selectedLanguages: string[]

  // Maîtrises d'outils à choix (background)
  selectedToolProficiencies: Record<string, string>

  // Étape 5 — Background personnalisé
  customBackgroundName: string
  customBackgroundSkills: string[]

  // Étape 6 — Équipement
  equipChoices: (string | null)[]
  equipSubChoices: Record<number, string | null>
  equipment: string[]

  // Faveur de Pacte (Occultiste niveau ≥ 3)
  pactBoon: 'chain' | 'blade' | 'tome' | null
  pactWeaponItemName: string | null
  selectedPactBoonCantripIds: number[]

  // Manifestations occultes (Occultiste niveau ≥ 2)
  invocationIds: number[]

  // Choix par palier d'ASI (niveau de classe) : carac ('asi') ou don ('feat').
  // Format : { 4: 'asi', 8: 'feat', 12: 'asi', ... }
  asiChoice: Record<number, 'asi' | 'feat'>

  // Bonus ASI répartis par palier d'ASI (uniquement quand asiChoice[lvl] === 'asi').
  // À chaque palier, le joueur dispose de 2 points à répartir (+2 sur une carac
  // OU +1+1 sur deux).
  // Format : { 4: { str: 2 }, 8: { dex: 1, con: 1 }, ... }
  asiBonuses: Record<number, Partial<Record<AbilityKey, number>>>

  // Don choisi par palier (uniquement quand asiChoice[lvl] === 'feat').
  // Format : { 8: 'alert', ... }. Note : la persistance des dons côté backend
  // est encore un TODO (cf. level-up.post.ts qui accepte featId sans le stocker).
  asiFeats: Record<number, string>

  // Arcanum mystique (Occultiste niv 11/13/15/17). Sort de niv 6/7/8/9
  // lançable 1× par repos long sans dépenser d'emplacement.
  arcaneMysteriumSpellId: number | null

  // Livre des secrets anciens (manifestation TCoE/Tome). 2 sorts rituels niv 1
  // inscrits dans le Livre des Ombres.
  bookOfAncientSecretsSpellIds: number[]
  // Flag positionné par StepSpells via watchEffect : true tant que la
  // manifestation est dans `invocationIds` → la validation step Sorts exige 2 rituels.
  bookOfAncientSecretsRequired: boolean
}

// Niveaux d'occultiste où l'Arcanum mystique débloque un nouveau slot (PHB 2014).
export const ARCANUM_SPELL_LEVEL_BY_LEVEL: Record<number, number> = {
  11: 6,
  13: 7,
  15: 8,
  17: 9,
}

// Nom canonique de la manifestation qui débloque la sélection de sorts rituels.
export const BOOK_OF_ANCIENT_SECRETS_NAME = 'Livre des secrets anciens'

// Niveaux d'ASI par classe (PHB 2014). Défaut [4,8,12,16,19] pour la majorité.
export const ASI_LEVELS_BY_CLASS: Record<string, number[]> = {
  fighter: [4, 6, 8, 12, 14, 16, 19],
  rogue: [4, 8, 10, 12, 16, 19],
}
const DEFAULT_ASI_LEVELS = [4, 8, 12, 16, 19]

// Invocations connues par niveau d'occultiste (PHB 2014)
// Index = warlockLevel - 1
export const WARLOCK_INVOCATIONS_KNOWN = [0, 2, 2, 2, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8]

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
  selectedLanguages: [],
  selectedToolProficiencies: {},
  customBackgroundName: '',
  customBackgroundSkills: [],
  equipChoices: [],
  equipSubChoices: {},
  equipment: [],
  pactBoon: null,
  pactWeaponItemName: null,
  selectedPactBoonCantripIds: [],
  invocationIds: [],
  asiChoice: {},
  asiBonuses: {},
  asiFeats: {},
  arcaneMysteriumSpellId: null,
  bookOfAncientSecretsSpellIds: [],
  bookOfAncientSecretsRequired: false,
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
  { id: 'asi', label: 'Bonus carac.', icon: 'i-heroicons:arrow-trending-up' },
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

  const needsPactBoon = computed(() =>
    state.value.classId === 'warlock' && state.value.level >= 3,
  )

  const invocationsExpected = computed(() => {
    if (state.value.classId !== 'warlock') return 0
    return WARLOCK_INVOCATIONS_KNOWN[state.value.level - 1] ?? 0
  })

  const needsInvocations = computed(() => invocationsExpected.value > 0)
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

  // Scores finaux (base + racial + ASI). PHB plafonne les ASI à 20.
  const finalAbilities = computed<Partial<Record<AbilityKey, number>>>(() => {
    const result: Partial<Record<AbilityKey, number>> = {}
    for (const ab of ABILITIES) {
      const base = state.value.abilities[ab]
      if (base != null) {
        const baseWithRace = base + (raceBonuses.value[ab] ?? 0)
        const asi = asiBonusByAbility.value[ab] ?? 0
        result[ab] = Math.min(20, baseWithRace + asi)
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
    const conMod = con != null ? abilityMod(con) : 0
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
  // Nombre de langues à choisir (race + sous-race + background)
  const languageChoiceCount = computed(() => {
    let count = 0
    const countChoices = (langs: string[]) => {
      for (const l of langs) {
        const m = l.match(/\+(\d+)\s+au choix/i)
        if (m) count += parseInt(m[1])
      }
    }
    countChoices(raceData.value?.languages ?? [])
    countChoices(subraceData.value?.languages ?? [])
    count += backgroundData.value?.languages ?? 0
    return count
  })

  const cantripsNeeded = computed(() => {
    if (!classData.value?.id) return 0
    return CANTRIPS_KNOWN[classData.value.id]?.[level.value - 1] ?? 0
  })

  // ─── Arcanum mystique (Occultiste niv 11/13/15/17) ────────────────────────

  const arcaneMysteriumSpellLevel = computed<number | null>(() => {
    if (state.value.classId !== 'warlock') return null
    return ARCANUM_SPELL_LEVEL_BY_LEVEL[state.value.level] ?? null
  })
  const needsArcaneMysterium = computed(() => arcaneMysteriumSpellLevel.value !== null)

  // ─── Livre des secrets anciens (manifestation) ────────────────────────────
  // L'ID de la manifestation est résolu côté composant via /api/invocations
  // (cf. StepSpells). On expose juste l'aide pour interroger l'état.
  const picksBookOfAncientSecrets = (allInvocationsByName: Record<string, number>) => {
    const id = allInvocationsByName[BOOK_OF_ANCIENT_SECRETS_NAME]
    if (!id) return false
    return state.value.invocationIds.includes(id)
  }

  // ─── ASI (paliers de bonus de caractéristique) ────────────────────────────────

  // Niveaux d'ASI atteints par ce personnage (selon classe + niveau choisi).
  const asiLevelsForCharacter = computed<number[]>(() => {
    const clsId = state.value.classId
    if (!clsId) return []
    const levels = ASI_LEVELS_BY_CLASS[clsId] ?? DEFAULT_ASI_LEVELS
    return levels.filter(l => l <= state.value.level)
  })

  const needsAsi = computed(() => asiLevelsForCharacter.value.length > 0)

  // Total des points ASI attribués à une carac, toutes ASI levels confondues.
  const asiBonusByAbility = computed<Partial<Record<AbilityKey, number>>>(() => {
    const sum: Partial<Record<AbilityKey, number>> = {}
    for (const lvl of asiLevelsForCharacter.value) {
      const bonuses = state.value.asiBonuses[lvl] ?? {}
      for (const [ab, amount] of Object.entries(bonuses) as [AbilityKey, number][]) {
        sum[ab] = (sum[ab] ?? 0) + amount
      }
    }
    return sum
  })

  // ─── Étapes actives ───────────────────────────────────────────────────────────

  const activeSteps = computed<BuilderStep[]>(() => {
    return ALL_STEPS.filter(s => {
      if (s.id === 'spells') return !!classData.value?.spellcasting
      if (s.id === 'asi') return needsAsi.value
      return true
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
        if (needsPactBoon.value && !s.pactBoon) return false
        if (needsInvocations.value && s.invocationIds.length < invocationsExpected.value) return false
        return true
      }
      case 'abilities': {
        return ABILITIES.every(ab => s.abilities[ab] != null)
      }
      case 'asi': {
        // Chaque palier exige un choix ASI/Don complet.
        for (const lvl of asiLevelsForCharacter.value) {
          const choice = s.asiChoice[lvl]
          if (!choice) return false
          if (choice === 'asi') {
            const bonuses = s.asiBonuses[lvl] ?? {}
            const total = Object.values(bonuses).reduce((sum, v) => sum + (v ?? 0), 0)
            if (total !== 2) return false
            // Garde-fou : pas plus de +2 sur une seule carac à chaque ASI.
            if (Object.values(bonuses).some(v => (v ?? 0) > 2)) return false
          }
          else if (choice === 'feat') {
            if (!s.asiFeats[lvl]) return false
          }
        }
        return true
      }
      case 'spells': {
        const cls = classData.value
        if (!cls?.spellcasting) return true
        const cantripsDone = cantripsNeeded.value === 0 || s.selectedCantrips.length >= cantripsNeeded.value
        // Arcanum mystique : 1 sort obligatoire au palier déclencheur
        if (needsArcaneMysterium.value && s.arcaneMysteriumSpellId == null) return false
        // Livre des secrets anciens : 2 sorts rituels obligatoires si l'invocation est choisie.
        // (Flag positionné par le composant via watchEffect — cf. StepSpells.)
        if (s.bookOfAncientSecretsRequired && s.bookOfAncientSecretsSpellIds.length < 2) return false
        // Pour les sorts : si classe préparée, pas de validation stricte
        const preparedCasters = ['cleric', 'druid', 'paladin', 'ranger', 'wizard']
        if (preparedCasters.includes(s.classId ?? '')) return cantripsDone
        const spellsNeeded = SPELLS_KNOWN[s.classId ?? '']?.[level.value - 1] ?? 0
        const spellsDone = spellsNeeded === 0 || s.selectedSpells.length >= spellsNeeded
        if (needsPactBoon.value && s.pactBoon === 'tome' && s.selectedPactBoonCantripIds.length < 3) return false
        return cantripsDone && spellsDone
      }
      case 'description': {
        if (!s.name.trim() || !s.backgroundId || !s.alignment) return false
        if (s.backgroundId === 'custom') {
          if (!s.customBackgroundName.trim()) return false
          if (s.customBackgroundSkills.length < 2) return false
        }
        return true
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

    // ASI summary : nb de paliers complétés / total
    const asiCompleted = asiLevelsForCharacter.value.filter((lvl) => {
      const bonuses = s.asiBonuses[lvl] ?? {}
      return Object.values(bonuses).reduce((sum, v) => sum + (v ?? 0), 0) === 2
    }).length
    const asiTotal = asiLevelsForCharacter.value.length

    return {
      race: raceName ?? null,
      class: className ? `${className} niv.${s.level}` : null,
      abilities: abilitiesDone === 6 ? 'Assignées ✓' : `${abilitiesDone}/6 assignées`,
      asi: asiTotal === 0 ? null : `${asiCompleted}/${asiTotal} palier(s)`,
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
    languageChoiceCount,
    LANGUAGES,
    TOOL_CHOICE_MAP,
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
    // Pacte
    needsPactBoon,
    // Invocations
    needsInvocations,
    invocationsExpected,
    // ASI
    needsAsi,
    asiLevelsForCharacter,
    asiBonusByAbility,
    // Arcanum / Livre des secrets
    needsArcaneMysterium,
    arcaneMysteriumSpellLevel,
    picksBookOfAncientSecrets,
  }
}
