import type { Ref } from 'vue'
import {
  KN_CREATION_KIT,
  KN_CREATION_VITAL_KEYS,
  knAllotmentIssues,
  knCreationSchema,
  knVitalRange,
  type KnAllotments,
  type KnCreationVital,
} from '~~/shared/ker-nethalas/creation'
import { knGoalPickIssues, type KnPersonalGoal } from '~~/shared/ker-nethalas/goals'
import { knMasteryPickIssues, type KnMastery } from '~~/shared/ker-nethalas/masteries'
import type { KnResistanceKey } from '~~/shared/ker-nethalas/skills'

export interface KnCreationDraft {
  name: string
  appearance: string
  vitals: Record<KnCreationVital, number | null>
  allotments: KnAllotments
  resistanceBoost: KnResistanceKey | null
  masteries: string[]
  // Tirage D6 du lieu d'entraînement de chaque Maîtrise choisie, par clé de Maîtrise.
  trainingRolls: Record<string, number>
  goals: string[]
  kitEnabled: boolean
  kit: {
    weapon: string
    armor: string
    cookingIngredients: number | null
    craftingSupplies: number | null
    coins: number | null
  }
}

export const emptyKnCreationDraft = (): KnCreationDraft => ({
  name: '',
  appearance: '',
  vitals: { health: null, toughness: null, aether: null, sanity: null },
  allotments: {},
  resistanceBoost: null,
  masteries: [],
  trainingRolls: {},
  goals: [],
  kitEnabled: false,
  kit: { weapon: '', armor: '', cookingIngredients: null, craftingSupplies: null, coins: null },
})

export const KN_CREATION_STEPS = [
  { id: 'identity', label: 'Identité', icon: 'i-heroicons:user' },
  { id: 'vitals', label: 'Jauges', icon: 'i-heroicons:heart' },
  { id: 'skills', label: 'Compétences', icon: 'i-heroicons:bolt' },
  { id: 'resistances', label: 'Résistances', icon: 'i-heroicons:shield-check' },
  { id: 'masteries', label: 'Maîtrises', icon: 'i-heroicons:sparkles' },
  { id: 'goals', label: 'Objectifs', icon: 'i-heroicons:flag' },
  { id: 'kit', label: 'Équipement', icon: 'i-heroicons:briefcase' },
] as const

export type KnCreationStepId = (typeof KN_CREATION_STEPS)[number]['id']

const inRange = (value: number | null, { min, max }: { min: number, max: number }) =>
  value !== null && Number.isInteger(value) && value >= min && value <= max

// Le lieu tiré pour une Maîtrise choisie, ou `undefined` si elle n'a pas encore de tirage.
export const knTrainingPlace = (mastery: KnMastery, rolls: Record<string, number>) => {
  const roll = rolls[mastery.key]
  return roll === undefined ? undefined : mastery.training[roll - 1]
}

export const knTrainingText = (draft: KnCreationDraft, masteries: KnMastery[] | null) =>
  (masteries ?? [])
    .filter(mastery => draft.masteries.includes(mastery.key))
    .flatMap((mastery) => {
      const place = knTrainingPlace(mastery, draft.trainingRolls)
      return place ? [`${mastery.name} : ${place.name} — ${place.text}`] : []
    })
    .join('\n')

// `masteries`, `goals` : le contenu chargé, ou `null` s'il ne l'est pas (ils se choisiront alors sur la fiche).
export function useKnCreation(masteries: Ref<KnMastery[] | null>, goals: Ref<KnPersonalGoal[] | null>) {
  const { t } = useI18n()
  const draft = ref(emptyKnCreationDraft())
  const currentStepId = ref<KnCreationStepId>('identity')

  const masteryIssues = computed(() => knMasteryPickIssues(draft.value.masteries, masteries.value?.map(mastery => mastery.key) ?? null))
  const goalIssues = computed(() => knGoalPickIssues(draft.value.goals, goals.value?.map(goal => goal.key) ?? null))

  const parsed = computed(() => {
    const d = draft.value
    return knCreationSchema.safeParse({
      name: d.name,
      appearance: d.appearance,
      training: knTrainingText(d, masteries.value),
      vitals: d.vitals,
      allotments: d.allotments,
      resistanceBoost: d.resistanceBoost ?? undefined,
      masteries: d.masteries,
      goals: d.goals,
      kit: d.kitEnabled ? d.kit : null,
    })
  })

  const complete = computed<Record<KnCreationStepId, boolean>>(() => {
    const d = draft.value
    return {
      identity: d.name.trim() !== '',
      vitals: KN_CREATION_VITAL_KEYS.every(vital => inRange(d.vitals[vital], knVitalRange(vital))),
      skills: knAllotmentIssues(d.allotments).length === 0,
      resistances: d.resistanceBoost !== null,
      masteries: masteryIssues.value.length === 0,
      goals: goalIssues.value.length === 0,
      kit: !d.kitEnabled || (
        inRange(d.kit.cookingIngredients, KN_CREATION_KIT.cookingIngredients)
        && inRange(d.kit.craftingSupplies, KN_CREATION_KIT.craftingSupplies)
        && inRange(d.kit.coins, KN_CREATION_KIT.coins)
      ),
    }
  })

  const missingSteps = computed(() => KN_CREATION_STEPS.filter(step => !complete.value[step.id]))
  const canCreate = computed(() => missingSteps.value.length === 0 && parsed.value.success)

  const stepIndex = computed(() => KN_CREATION_STEPS.findIndex(step => step.id === currentStepId.value))
  const isLastStep = computed(() => stepIndex.value === KN_CREATION_STEPS.length - 1)
  const canGoPrev = computed(() => stepIndex.value > 0)
  const canGoNext = computed(() => complete.value[currentStepId.value])

  const isStepComplete = (stepId: string) => complete.value[stepId as KnCreationStepId] ?? false

  const goTo = (stepId: string) => {
    if (KN_CREATION_STEPS.some(step => step.id === stepId)) currentStepId.value = stepId as KnCreationStepId
  }
  const goNext = () => {
    const next = KN_CREATION_STEPS[stepIndex.value + 1]
    if (next && canGoNext.value) currentStepId.value = next.id
  }
  const goPrev = () => {
    const previous = KN_CREATION_STEPS[stepIndex.value - 1]
    if (previous) currentStepId.value = previous.id
  }

  const stepSummaries = computed<Record<string, string | null>>(() => {
    const d = draft.value
    const assigned = Object.keys(d.allotments).length
    return {
      identity: d.name.trim() || null,
      vitals: complete.value.vitals ? KN_CREATION_VITAL_KEYS.map(vital => d.vitals[vital]).join(' · ') : null,
      skills: assigned ? `${assigned}/10 enveloppes` : null,
      resistances: d.resistanceBoost ? `40 en ${t(`ker_nethalas.resistances.${d.resistanceBoost}`)}` : null,
      masteries: d.masteries.length ? d.masteries.map(key => masteries.value?.find(mastery => mastery.key === key)?.name ?? key).join(' · ') : null,
      goals: d.goals.length ? d.goals.map(key => goals.value?.find(goal => goal.key === key)?.name ?? key).join(' · ') : null,
      kit: d.kitEnabled ? 'Équipement de départ' : 'Première partie',
    }
  })

  return { draft, currentStepId, parsed, complete, missingSteps, canCreate, canGoNext, canGoPrev, isLastStep, isStepComplete, stepSummaries, goTo, goNext, goPrev }
}
