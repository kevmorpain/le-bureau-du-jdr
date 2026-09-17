import type { AbilityKey } from './abilities'
import type { ChoiceKind, OptionSource } from './choices'

// Notation : montants triés décroissant, joints par `+`.
export const ASI_DISTRIBUTIONS = ['2', '1+1'] as const
export type AsiDistribution = (typeof ASI_DISTRIBUTIONS)[number]

export type AbilityDistribution = '2+1' | '1+1+1'

export interface DistributionCheck { ok: boolean, reason?: string }

function distributionSignature(amounts: number[]): string {
  return [...amounts].sort((a, b) => b - a).join('+')
}

function positiveAmounts(entries: [string, number][]): DistributionCheck {
  for (const [ability, amount] of entries) {
    if (!Number.isInteger(amount) || amount <= 0) return { ok: false, reason: `Montant invalide pour « ${ability} ».` }
  }
  return { ok: true }
}

export function isValidAbilityDistribution(
  payload: Partial<Record<AbilityKey, number>>,
  source: { from: AbilityKey[], distributions: readonly AbilityDistribution[] },
): DistributionCheck {
  const entries = Object.entries(payload) as [AbilityKey, number][]
  if (entries.length === 0) return { ok: false, reason: 'Aucune caractéristique répartie.' }
  const amounts = positiveAmounts(entries)
  if (!amounts.ok) return amounts
  const from = new Set(source.from)
  for (const [ability] of entries) {
    if (!from.has(ability)) return { ok: false, reason: `Caractéristique « ${ability} » hors des choix autorisés.` }
  }
  const sig = distributionSignature(entries.map(([, a]) => a))
  if (!(source.distributions as readonly string[]).includes(sig)) {
    return { ok: false, reason: `Répartition « ${sig} » non autorisée (attendu : ${source.distributions.join(' ou ')}).` }
  }
  return { ok: true }
}

export function isValidAsiDistribution(payload: Partial<Record<AbilityKey, number>>): DistributionCheck {
  const entries = Object.entries(payload) as [AbilityKey, number][]
  if (entries.length === 0) return { ok: false, reason: 'Aucune caractéristique améliorée.' }
  const amounts = positiveAmounts(entries)
  if (!amounts.ok) return amounts
  const sig = distributionSignature(entries.map(([, a]) => a))
  if (!(ASI_DISTRIBUTIONS as readonly string[]).includes(sig)) {
    return { ok: false, reason: `Répartition d'ASI « ${sig} » non autorisée (attendu : +2 sur une, ou +1 sur deux).` }
  }
  return { ok: true }
}

export type AsiOrFeatPick =
  | { branch: 'asi', payload: Partial<Record<AbilityKey, number>> }
  | { branch: 'feat', featureId: number }

// L'éligibilité du don (catégorie, prérequis) est vérifiée par `isOptionEligible`, pas ici.
export function isValidAsiOrFeat(pick: AsiOrFeatPick): DistributionCheck {
  if (pick.branch === 'asi') return isValidAsiDistribution(pick.payload)
  if (pick.featureId == null) return { ok: false, reason: 'Aucun don sélectionné.' }
  return { ok: true }
}

export type CompositeShape =
  | { kind: 'ability_scores', abilities: AbilityKey[], distributions: AbilityDistribution[] }
  | { kind: 'asi_or_feat', asiDistributions: readonly AsiDistribution[], featCategory?: string }

/** `null` = choix « N dans une liste » classique. */
export function describeCompositeChoice(kind: ChoiceKind, optionSource: OptionSource): CompositeShape | null {
  if (kind === 'ability_scores' && optionSource.type === 'abilities') {
    return { kind, abilities: optionSource.from, distributions: optionSource.distributions }
  }
  if (kind === 'asi_or_feat') {
    const featCategory = optionSource.type === 'feats' ? optionSource.category : undefined
    return { kind, asiDistributions: ASI_DISTRIBUTIONS, featCategory }
  }
  return null
}
