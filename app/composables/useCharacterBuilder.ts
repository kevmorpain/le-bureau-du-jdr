import {
  RACES,
  CLASSES,
  BACKGROUNDS,
  ALIGNMENTS,
  ABILITIES,
  ABILITY_SHORT,
  SKILLS,
  LANGUAGES,
  TOOL_CHOICE_MAP,
  extraLanguagesFromToolChoices,
  abilityMod,
  formatMod,
  profBonusAtLevel,
  hpAtLevel,
  spellSlotsAtLevel,
  maxSpellLevelAtLevel,
  type AbilityKey,
  type SubraceData,
} from '~/data/character-builder'
import { ALL_TOOLS, SKILLED_FEAT_COUNT } from '~~/shared/rules/tools'
import { cantripsKnownAt, spellLearningOf, spellsKnownAt } from '~~/shared/rules/spellsKnown'
import type { Effect } from '~~/server/db/schema/effects'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BuilderState {
  // Étape 1 — Race
  raceId: string | null
  isVariantHuman: boolean
  subraceId: string | null
  halfElfBonuses: AbilityKey[]
  variantHumanBonuses: AbilityKey[]
  variantHumanSkill: string | null
  // Bonus de caractéristiques FLEXIBLES (Fadette/MPMM : +2 sur une carac. et +1 sur une autre,
  // OU +1 sur trois). Distribution au choix du joueur ; somme attendue = 3, max 2 par carac.
  fairyAsiBonuses: Partial<Record<AbilityKey, number>>

  // Étape 2 — Classe
  classId: string | null
  subclass: string | null
  skills: string[]
  level: number
  fightingStyle: string | null
  expertiseSkills: string[]
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

  age: string
  height: string
  weight: string
  eyes: string
  hair: string
  skin: string
  deity: string
  backstory: string
  allies: string
  portraitUrl: string

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

  // Options de Métamagie (Ensorceleur niveau ≥ 3)
  metamagicIds: number[]

  // Choix par palier d'ASI (niveau de classe) : carac ('asi') ou don ('feat').
  // Format : { 4: 'asi', 8: 'feat', 12: 'asi', ... }
  asiChoice: Record<number, 'asi' | 'feat'>

  // Bonus ASI répartis par palier d'ASI (uniquement quand asiChoice[lvl] === 'asi').
  // À chaque palier, le joueur dispose de 2 points à répartir (+2 sur une carac
  // OU +1+1 sur deux).
  // Format : { 4: { str: 2 }, 8: { dex: 1, con: 1 }, ... }
  asiBonuses: Record<number, Partial<Record<AbilityKey, number>>>

  // Don choisi par palier (uniquement quand asiChoice[lvl] === 'feat').
  // Valeur = features.id du don (résolu via useFeats). Persisté via
  // character_features avec source='asi'.
  asiFeats: Record<number, number>

  // Don bonus hors-palier (homebrew MJ). Choisi via le step dédié 'feats'.
  // Valeur = features.id du don. Persisté via character_features avec source='bonus'.
  bonusFeatureId: number | null

  // Choix résolus des dons (ex : caractéristique +1 d'Observateur), indexés par
  // features.id du don. Vaut pour le don bonus ET les dons d'ASI.
  featChoices: Record<number, { ability?: AbilityKey, spellId?: number, skills?: string[], tools?: string[] }>

  // Arcanums mystiques (Occultiste niv 11/13/15/17). À la création d'un perso de haut
  // niveau, TOUS les arcanums débloqués (≤ niveau) sont configurables → map niveau de
  // sort (6/7/8/9) → id du sort choisi (lançable 1× par repos long, sans emplacement).
  arcaneMysteriumSpellIds: Record<number, number>

  bookOfAncientSecretsSpellIds: number[]
  // Flag positionné par StepSpells via watchEffect : true tant que la
  // manifestation est dans `invocationIds` → la validation step Sorts exige 2 rituels.
  bookOfAncientSecretsRequired: boolean
}

export const BOOK_OF_ANCIENT_SECRETS_NAME = 'Livre des secrets anciens'

const INIT_STATE: BuilderState = {
  raceId: null,
  isVariantHuman: false,
  subraceId: null,
  halfElfBonuses: [],
  variantHumanBonuses: [],
  variantHumanSkill: null,
  fairyAsiBonuses: {},
  classId: null,
  subclass: null,
  skills: [],
  level: 1,
  fightingStyle: null,
  expertiseSkills: [],
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
  age: '',
  height: '',
  weight: '',
  eyes: '',
  hair: '',
  skin: '',
  deity: '',
  backstory: '',
  allies: '',
  portraitUrl: '',
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
  metamagicIds: [],
  asiChoice: {},
  asiBonuses: {},
  asiFeats: {},
  bonusFeatureId: null,
  featChoices: {},
  arcaneMysteriumSpellIds: {},
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
  { id: 'feats', label: 'Don bonus', icon: 'i-heroicons:sparkles' },
  { id: 'spells', label: 'Sorts', icon: 'i-game-icons:spell-book' },
  { id: 'description', label: 'Description', icon: 'i-heroicons:document-text' },
  { id: 'equipment', label: 'Équipement', icon: 'i-game-icons:backpack' },
]

const LS_KEY = 'character-builder-state'

// Copie profonde : les étapes modifient tableaux et objets en place (push, splice…), ce qui
// polluerait INIT_STATE via une copie superficielle.
const freshState = (): BuilderState => structuredClone(INIT_STATE)

// ─── Composable ───────────────────────────────────────────────────────────────

export function useCharacterBuilder() {
  // Lu à l'init de `useState` : n'a lieu côté client que parce que /characters/new n'est pas
  // rendue en SSR (routeRules) — sinon l'état vide du payload l'emporte à l'hydratation.
  const state = useState<BuilderState>('character-builder', () => {
    if (import.meta.client) {
      try {
        const saved = localStorage.getItem(LS_KEY)
        // Merge avec INIT_STATE pour que les nouveaux champs (ex : featChoices)
        // ne soient pas undefined sur un état sauvegardé par une version antérieure.
        if (saved) return { ...freshState(), ...(JSON.parse(saved) as BuilderState) }
      }
      catch {}
    }
    return freshState()
  })

  if (import.meta.client) {
    watch(state, (val) => {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(val))
      }
      catch {}
    }, { deep: true })
  }

  // ─── Dons (liste + helpers pour les choix) ────────────────────────────────────

  const { feats, getById: getFeatById } = useFeats()
  const { choicesForClassLevel } = useCatalog()
  const { resolveClassId, subclassCatalogFor } = useBuilderEntities()

  const featNeedsAbility = (featureId: number | null | undefined): boolean => {
    if (featureId == null) return false
    const feat = getFeatById(featureId)
    return (feat?.effects ?? []).some((e: any) => e.type === 'ability_increase_choice')
  }

  // Un don requiert-il un choix de SORT (ex. Faveur des fées) ? Repéré par l'effet marqueur
  // `other:{kind:'fey_touched_spells'}` (data/feats.ts).
  const featNeedsSpell = (featureId: number | null | undefined): boolean => {
    if (featureId == null) return false
    const feat = getFeatById(featureId)
    return (feat?.effects ?? []).some((e: any) => e.type === 'other' && (e.value as any)?.kind === 'fey_touched_spells')
  }

  // Le don Doué (`other:{kind:'skilled_choice'}`) accorde 3 maîtrises AU CHOIX (compétences ou outils).
  const featNeedsSkilled = (featureId: number | null | undefined): boolean => {
    if (featureId == null) return false
    const feat = getFeatById(featureId)
    return (feat?.effects ?? []).some((e: any) => e.type === 'other' && (e.value as any)?.kind === 'skilled_choice')
  }

  const featChoiceComplete = (featureId: number | null | undefined): boolean => {
    if (featureId == null) return true
    if (featNeedsAbility(featureId) && !state.value.featChoices[featureId]?.ability) return false
    if (featNeedsSpell(featureId) && !state.value.featChoices[featureId]?.spellId) return false
    if (featNeedsSkilled(featureId)) {
      const c = state.value.featChoices[featureId]
      if (((c?.skills?.length ?? 0) + (c?.tools?.length ?? 0)) !== SKILLED_FEAT_COUNT) return false
    }
    return true
  }

  // ─── Données dérivées ────────────────────────────────────────────────────────

  const raceData = computed(() => RACES.find(r => r.id === state.value.raceId) ?? null)
  // Espèces « base + lignée » (D17) : sous-races PILOTÉES PAR LE CATALOGUE via le champ opt-in
  // `lineageBaseSpeciesName` ; repli transparent sur le blob `RaceData.subraces` sinon.
  const lineageBaseName = computed(() => raceData.value?.lineageBaseSpeciesName ?? null)
  // Espèce du catalogue de la race, avec ou sans lignée : ses effets alimentent le récapitulatif.
  const catalogSpeciesName = computed(() => lineageBaseName.value ?? raceData.value?.dbName ?? null)
  const { baseSpeciesId: catalogSpeciesId, lineageSubraces, effectsFor, effectsLoaded: speciesEffectsLoaded } = useSpeciesLineages(catalogSpeciesName)
  const subraces = computed<SubraceData[]>(() => {
    if (lineageBaseName.value && lineageSubraces.value.length) return lineageSubraces.value
    return raceData.value?.subraces ?? []
  })
  const subraceData = computed(() => {
    if (!state.value.subraceId) return null
    return subraces.value.find(s => s.id === state.value.subraceId) ?? null
  })
  const selectedLineageId = computed(() => subraceData.value?.lineageId ?? null)
  // Lignée unique (ex. Tieffelin → Asmodée) : auto-sélection pour ne pas imposer un faux choix.
  watch(subraces, (subs) => {
    if (lineageBaseName.value && subs.length === 1 && !subs.some(s => s.id === state.value.subraceId)) {
      state.value.subraceId = subs[0]!.id
    }
  }, { immediate: true })
  const classData = computed(() => CLASSES.find(c => c.id === state.value.classId) ?? null)
  const backgroundData = computed(() => BACKGROUNDS.find(b => b.id === state.value.backgroundId) ?? null)

  // Points de choix lus dans le catalogue et résolus localement.
  const classDbId = computed(() => resolveClassId(classData.value?.dbName))
  const catalogChoices = computed(() =>
    choicesForClassLevel(classDbId.value, state.value.level),
  )

  const needsPactBoon = computed(() => catalogChoices.value.some(c => c.kind === 'pact_boon'))

  // ─── Sous-classe (lue dans le CATALOGUE) ───────────────────────────────────
  const subclassCatalog = computed(() => subclassCatalogFor(classDbId.value))
  const subclassLevel = computed(() => subclassCatalog.value?.subclassLevel ?? null)
  const subclassOptions = computed(() => subclassCatalog.value?.subclasses ?? [])
  const needsSubclass = computed(() => catalogChoices.value.some(c => c.kind === 'subclass'))

  // ─── Style de combat (lu dans le CATALOGUE, F2 tranche 4) — miroir de la sous-classe. ────
  // Gating dérivé de resolveChoices (le choix n'est dû qu'au palier d'accès : Guerrier 1,
  // Paladin/Rôdeur 2) ; les OPTIONS (nom + description) viennent de l'endpoint
  // `/api/catalog/classes/[name]/fighting-styles` (côté StepClass). Le style envoyé au serveur est
  // son NOM ; le serveur re-gate par niveau. Remplace le blob `FIGHTING_STYLES`.
  const needsFightingStyle = computed(() => catalogChoices.value.some(c => c.kind === 'fighting_style'))
  const fightingStyleLevel = computed(() => catalogChoices.value.find(c => c.kind === 'fighting_style')?.ownerLevelRequired ?? null)

  const invocationsExpected = computed(() =>
    catalogChoices.value.find(c => c.kind === 'invocations')?.count ?? 0,
  )

  const needsInvocations = computed(() => invocationsExpected.value > 0)

  const metamagicExpected = computed(() =>
    catalogChoices.value.find(c => c.kind === 'metamagic')?.count ?? 0,
  )
  const needsMetamagic = computed(() => metamagicExpected.value > 0)

  // ─── Expertise (lue dans le CATALOGUE, miroir de la sous-classe) ───────────
  // Éligibilité = toute compétence maîtrisée (classe, espèce, historique, variante) ; l'appartenance
  // reste front-autoritaire.
  const expertiseExpected = computed(() => catalogChoices.value.find(c => c.kind === 'expertise')?.count ?? 0)
  const needsExpertise = computed(() => expertiseExpected.value > 0)
  const isVariantHuman = computed(() => state.value.raceId === 'human' && state.value.isVariantHuman)
  // Humain variant : la création ne lie aucune espèce.
  const speciesEffects = computed<Effect[]>(() => isVariantHuman.value ? [] : effectsFor(selectedLineageId.value))
  const speciesSkillsLoaded = computed(() => isVariantHuman.value || speciesEffectsLoaded.value)
  // Octrois FIXES seulement : `skill_proficiency_choice` (Demi-elfe) n'a pas de picker.
  const speciesSkills = computed<string[]>(() =>
    speciesEffects.value.flatMap(e => e.type === 'skill_proficiency' ? [e.value.skill] : []),
  )
  const isCustomBackground = computed(() => backgroundData.value?.id === 'custom')
  const backgroundSkills = computed<string[]>(() =>
    isCustomBackground.value ? state.value.customBackgroundSkills : (backgroundData.value?.skillProficiencies ?? []),
  )
  const variantHumanSkills = computed<string[]>(() =>
    isVariantHuman.value && state.value.variantHumanSkill ? [state.value.variantHumanSkill] : [],
  )
  // Sans porteur en base (historique personnalisé, Humain variant) → matérialisées en `character_skills` ;
  // celles d'un historique seedé sont dérivées de son porteur (F3).
  const materializedSkills = computed<string[]>(() => [
    ...(isCustomBackground.value ? state.value.customBackgroundSkills : []),
    ...variantHumanSkills.value,
  ])
  // Maîtrises FIXES hors classe, avec leur source (la compétence de l'Humain variant est un trait d'espèce).
  const grantedSkillSources = computed(() => {
    const sources = new Map<string, 'espèce' | 'historique'>()
    for (const skill of [...speciesSkills.value, ...variantHumanSkills.value]) sources.set(skill, 'espèce')
    for (const skill of backgroundSkills.value) if (!sources.has(skill)) sources.set(skill, 'historique')
    return sources
  })
  const proficientSkills = computed<string[]>(() =>
    [...new Set([...state.value.skills, ...grantedSkillSources.value.keys()])],
  )
  // Compétences de classe CHOISIES en doublon avec une source FIXE : le doublon est gaspillé (F3). On
  // l'INDIQUE (StepClass/StepDescription) pour que le joueur change son choix de classe — non bloquant.
  // L'historique étant choisi APRÈS la classe, son doublon n'apparaît qu'une fois l'historique choisi.
  const classSkillConflicts = computed<string[]>(() =>
    state.value.skills.filter(s => grantedSkillSources.value.has(s)),
  )
  const classSkillConflictLabels = computed(() => classSkillConflicts.value
    .map(k => `${SKILLS.find(s => s.key === k)?.label ?? k} (${grantedSkillSources.value.get(k)})`)
    .join(', '))
  // Outils déjà maîtrisés (historique) : exclus du picker Doué pour ne pas gaspiller un choix. On ne
  // retient que les entrées CONCRÈTES de l'historique (les placeholders « … au choix » sont résolus
  // dans selectedToolProficiencies) + les résolutions choisies.
  const ownedTools = computed<string[]>(() => {
    const fixed = (backgroundData.value?.toolProficiencies ?? []).filter(t => ALL_TOOLS.includes(t))
    const chosen = Object.values(state.value.selectedToolProficiencies).filter(Boolean)
    return [...new Set([...fixed, ...chosen])]
  })
  // Un pick d'expertise sur une compétence qu'on ne maîtrise plus (désélection) ou d'une classe
  // sans expertise (changement de classe) ne doit pas survivre. Purge différée tant que les compétences
  // d'espèce arrivent (état restauré, changement de race) : un pick sur l'une d'elles serait perdu.
  watch([proficientSkills, speciesSkillsLoaded], ([prof, loaded]) => {
    if (!loaded) return
    state.value.expertiseSkills = state.value.expertiseSkills.filter(s => prof.includes(s))
  })
  watch(expertiseExpected, (count) => {
    if (state.value.expertiseSkills.length > count) state.value.expertiseSkills = state.value.expertiseSkills.slice(0, count)
  })

  const alignmentData = computed(() => ALIGNMENTS.find(a => a.id === state.value.alignment) ?? null)

  const raceBonuses = computed<Partial<Record<AbilityKey, number>>>(() => {
    const bonuses: Partial<Record<AbilityKey, number>> = {}
    const addBonus = (k: AbilityKey, v: number) => {
      bonuses[k] = (bonuses[k] ?? 0) + v
    }

    const race = raceData.value
    if (!race) return bonuses

    const hasSub = !!subraceData.value
    if (!hasSub || race.id === 'half-elf') {
      for (const [k, v] of Object.entries(race.abilityBonuses) as [AbilityKey, number][]) {
        addBonus(k, v)
      }
    }

    if (subraceData.value) {
      for (const [k, v] of Object.entries(subraceData.value.abilityBonuses) as [AbilityKey, number][]) {
        addBonus(k, v)
      }
    }

    if (race.id === 'human' && state.value.isVariantHuman) {
      // Variante humaine : on retire les +1 universels avant d'appliquer les +1+1 au choix.
      for (const k of ABILITIES) bonuses[k] = 0
    }

    for (const [k, v] of Object.entries(chosenRaceAbilityBonuses(state.value)) as [AbilityKey, number][]) {
      addBonus(k, v)
    }

    return bonuses
  })

  // Scores finaux (base + racial + ASI + bonus de dons). PHB plafonne à 20.
  const finalAbilities = computed<Partial<Record<AbilityKey, number>>>(() => {
    const result: Partial<Record<AbilityKey, number>> = {}
    for (const ab of ABILITIES) {
      const base = state.value.abilities[ab]
      if (base != null) {
        const baseWithRace = base + (raceBonuses.value[ab] ?? 0)
        const asi = asiBonusByAbility.value[ab] ?? 0
        const feat = featBonusByAbility.value[ab] ?? 0
        result[ab] = Math.min(20, baseWithRace + asi + feat)
      }
    }
    return result
  })

  const hasAbilities = computed(() => ABILITIES.some(ab => finalAbilities.value[ab] != null))

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

  const spellcastingInfo = computed(() => classData.value?.spellcasting ?? null)
  const spellSlots = computed(() => {
    if (!spellcastingInfo.value) return null
    return spellSlotsAtLevel(spellcastingInfo.value.type, level.value)
  })
  const maxSpellLevel = computed(() => {
    if (!spellcastingInfo.value) return 0
    return maxSpellLevelAtLevel(spellcastingInfo.value.type, level.value)
  })
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
    count += extraLanguagesFromToolChoices(state.value.selectedToolProficiencies)
    return count
  })

  const cantripsNeeded = computed(() => {
    if (!classData.value?.id) return 0
    return cantripsKnownAt(classData.value.id, level.value)
  })

  // ─── Arcanums mystiques (Occultiste niv 11/13/15/17) ──────────────────────
  // Tous les paliers débloqués (≤ niveau), pas seulement celui du niveau exact.
  const arcaneMysteriumSpellLevels = computed<number[]>(() =>
    catalogChoices.value
      .filter(ch => ch.kind === 'spell' && ch.optionSource.type === 'spells')
      .map(ch => (ch.optionSource.type === 'spells' ? ch.optionSource.maxLevel ?? null : null))
      .filter((l): l is number => l !== null)
      .sort((a, b) => a - b),
  )
  const needsArcaneMysterium = computed(() => arcaneMysteriumSpellLevels.value.length > 0)

  // ─── Livre des secrets anciens (manifestation) ────────────────────────────
  const picksBookOfAncientSecrets = (allInvocationsByName: Record<string, number>) => {
    const id = allInvocationsByName[BOOK_OF_ANCIENT_SECRETS_NAME]
    if (!id) return false
    return state.value.invocationIds.includes(id)
  }

  // ─── ASI (paliers de bonus de caractéristique) ────────────────────────────────

  // resolveChoices ne rend que les paliers ≤ niveau de classe → pas de filtre explicite ici.
  const asiLevelsForCharacter = computed<number[]>(() =>
    catalogChoices.value
      .filter(c => c.kind === 'asi_or_feat')
      .map(c => c.ownerLevelRequired)
      .sort((a, b) => a - b),
  )

  const needsAsi = computed(() => asiLevelsForCharacter.value.length > 0)

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

  // Ceux que la création persistera : le don bonus + le don des paliers d'ASI dus où « don » est choisi
  // (un don resté dans `asiFeats` d'un palier désélectionné ou au-dessus du niveau n'est pas envoyé).
  const chosenFeatIds = computed<number[]>(() => [
    state.value.bonusFeatureId,
    ...asiLevelsForCharacter.value
      .filter(lvl => state.value.asiChoice[lvl] === 'feat')
      .map(lvl => state.value.asiFeats[lvl]),
  ].filter((id): id is number => id != null))

  // Bonus de carac. apportés par les dons choisis : sans ça, un demi-don n'était reflété ni dans
  // l'aperçu ni dans les paliers d'ASI suivants (bug B4).
  const featBonusByAbility = computed<Partial<Record<AbilityKey, number>>>(() => {
    const sum: Partial<Record<AbilityKey, number>> = {}
    for (const id of chosenFeatIds.value) {
      for (const e of (getFeatById(id)?.effects ?? []) as any[]) {
        if (e.type === 'ability_increase') {
          const ab = e.value.ability as AbilityKey
          sum[ab] = (sum[ab] ?? 0) + e.value.amount
        }
        else if (e.type === 'ability_increase_choice') {
          const ab = state.value.featChoices[id]?.ability
          if (ab) sum[ab] = (sum[ab] ?? 0) + (e.value.amount ?? 0)
        }
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
        if (subraces.value.length && !s.subraceId) return false
        if (s.raceId === 'half-elf' && s.halfElfBonuses.length < 2) return false
        if (s.raceId === 'human' && s.isVariantHuman) {
          if (s.variantHumanBonuses.length < 2 || !s.variantHumanSkill) return false
        }
        // Fadette : les bonus flexibles doivent totaliser exactement 3 (+2/+1 ou +1/+1/+1).
        if (s.raceId === 'fairy' && Object.values(s.fairyAsiBonuses).reduce((a, b) => a + (b ?? 0), 0) !== 3) return false
        return true
      }
      case 'class': {
        if (!s.classId) return false
        const cls = classData.value
        if (!cls) return false
        if (s.skills.length < cls.skillChoices.count) return false
        // Style de combat requis quand le catalogue le rend dû à ce niveau (Guerrier 1, Paladin/Rôdeur 2).
        if (needsFightingStyle.value && !s.fightingStyle) return false
        if (needsExpertise.value && s.expertiseSkills.length < expertiseExpected.value) return false
        if (needsPactBoon.value && !s.pactBoon) return false
        if (needsInvocations.value && s.invocationIds.length < invocationsExpected.value) return false
        if (needsMetamagic.value && s.metamagicIds.length < metamagicExpected.value) return false
        return true
      }
      case 'abilities': {
        return ABILITIES.every(ab => s.abilities[ab] != null)
      }
      case 'asi': {
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
            if (s.asiFeats[lvl] == null) return false
            if (!featChoiceComplete(s.asiFeats[lvl])) return false
          }
        }
        return true
      }
      case 'feats': {
        // Le don bonus est optionnel, mais ses choix deviennent obligatoires s'il est choisi.
        if (s.bonusFeatureId != null && !featChoiceComplete(s.bonusFeatureId)) return false
        return true
      }
      case 'spells': {
        const cls = classData.value
        if (!cls?.spellcasting) return true
        const cantripsDone = cantripsNeeded.value === 0 || s.selectedCantrips.length >= cantripsNeeded.value
        // Arcanums mystiques : un sort obligatoire par palier débloqué (≤ niveau)
        if (arcaneMysteriumSpellLevels.value.some(lvl => s.arcaneMysteriumSpellIds[lvl] == null)) return false
        // Livre des secrets anciens : 2 sorts rituels obligatoires si l'invocation est choisie.
        // (Flag positionné par le composant via watchEffect — cf. StepSpells.)
        if (s.bookOfAncientSecretsRequired && s.bookOfAncientSecretsSpellIds.length < 2) return false
        if (spellLearningOf(s.classId ?? '') !== 'known') return cantripsDone
        const spellsNeeded = spellsKnownAt(s.classId ?? '', level.value)
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
      feats: s.bonusFeatureId != null ? 'don bonus' : null,
      spells: cantripCount + spellCount > 0 ? `${cantripCount + spellCount} sorts` : null,
      description: s.name.trim() || null,
      equipment: s.equipment.length > 0 ? `${s.equipment.length} objets` : null,
    }
  })

  // ─── Reset ────────────────────────────────────────────────────────────────────

  function resetBuilder() {
    state.value = freshState()
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
    subraces,
    subraceData,
    selectedLineageId,
    catalogSpeciesId,
    speciesEffects,
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
    RACES,
    CLASSES,
    BACKGROUNDS,
    ALIGNMENTS,
    // Utilitaires
    abilityMod,
    formatMod,
    profBonusAtLevel,
    // Sous-classe (catalogue)
    needsSubclass,
    subclassLevel,
    subclassOptions,
    // Style de combat (catalogue)
    needsFightingStyle,
    fightingStyleLevel,
    // Expertise (catalogue)
    needsExpertise,
    expertiseExpected,
    isVariantHuman,
    isCustomBackground,
    backgroundSkills,
    materializedSkills,
    proficientSkills,
    classSkillConflicts,
    classSkillConflictLabels,
    ownedTools,
    // Pacte
    needsPactBoon,
    // Invocations
    needsInvocations,
    invocationsExpected,
    // Métamagie
    needsMetamagic,
    metamagicExpected,
    // ASI
    needsAsi,
    asiLevelsForCharacter,
    asiBonusByAbility,
    featBonusByAbility,
    // Dons
    feats,
    chosenFeatIds,
    getFeatById,
    featNeedsAbility,
    featNeedsSpell,
    featNeedsSkilled,
    featChoiceComplete,
    // Arcanums / Livre des secrets
    needsArcaneMysterium,
    arcaneMysteriumSpellLevels,
    picksBookOfAncientSecrets,
  }
}
