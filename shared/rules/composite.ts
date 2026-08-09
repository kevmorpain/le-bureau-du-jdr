import type { AbilityKey } from './abilities'
import type { ChoiceKind, OptionSource } from './choices'

/**
 * Choix COMPOSITES à payload — validateurs purs + description de forme (Lot B+C, sous-lot C1).
 *
 * Le modèle « choisir N dans une liste » de `resolve.ts` ne couvre pas les points de choix dont
 * le pick est une STRUCTURE et non une option discrète (cf. resolve.ts §LIMITE) :
 *  - `ability_scores` — la triade 2024 : répartir des bonus sur des carac. selon une distribution
 *    autorisée (`+2/+1` sur deux, ou `+1/+1/+1` sur trois) ; pick stocké en `character_choices.payload` ;
 *  - `asi_or_feat` — au palier d'ASI, choisir SOIT une amélioration de carac. (répartition), SOIT un don.
 *
 * Ce module porte le CONTRAT pur : les validateurs (autorité serveur en C3) et un descripteur de
 * forme pour l'UI. Node-safe : aucun import de valeur `~~`/`hub:db` (types seuls, effacés au build)
 * → importable par le projet vitest `unit`, comme `resolve.ts`.
 */

/**
 * Répartitions d'ASI standard — règle FIXE d'édition (2014 : +2 sur une carac., ou +1 sur deux),
 * pas une donnée portée par la progression. Notation = montants triés décroissant, joints par `+`.
 */
export const ASI_DISTRIBUTIONS = ['2', '1+1'] as const
export type AsiDistribution = (typeof ASI_DISTRIBUTIONS)[number]

/** Distributions de la triade d'origine 2024 (cf. OptionSource `{abilities}`). */
export type AbilityDistribution = '2+1' | '1+1+1'

/** Résultat d'une validation de répartition : `ok`, plus une raison lisible pour les 422 (C3). */
export interface DistributionCheck { ok: boolean, reason?: string }

/** Signature d'une répartition = ses montants triés décroissant joints par `+` (« 2+1 », « 1+1+1 »). */
function distributionSignature(amounts: number[]): string {
  return [...amounts].sort((a, b) => b - a).join('+')
}

/** Montants entiers strictement positifs ? (garde commune aux deux validateurs.) */
function positiveAmounts(entries: [string, number][]): DistributionCheck {
  for (const [ability, amount] of entries) {
    if (!Number.isInteger(amount) || amount <= 0) return { ok: false, reason: `Montant invalide pour « ${ability} ».` }
  }
  return { ok: true }
}

/**
 * Une triade (payload `{str:2, dex:1}`) est-elle une répartition LÉGALE de `source` ?
 * Chaque carac. ∈ `from`, montants entiers > 0, et la signature ∈ `distributions` autorisées.
 */
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

/** Une amélioration d'ASI (payload) est-elle légale (+2 sur une, ou +1 sur deux) ? */
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

/** Un pick d'un point de choix `asi_or_feat` : soit une amélioration de carac., soit un don. */
export type AsiOrFeatPick =
  | { branch: 'asi', payload: Partial<Record<AbilityKey, number>> }
  | { branch: 'feat', featureId: number }

/**
 * Un pick `asi_or_feat` est-il bien FORMÉ ? La branche `asi` valide la répartition ; la branche
 * `feat` exige un `featureId` — son ÉLIGIBILITÉ (catégorie, prérequis) est vérifiée par
 * `isOptionEligible` côté résolution, pas ici (ce module ne touche pas l'état du perso).
 */
export function isValidAsiOrFeat(pick: AsiOrFeatPick): DistributionCheck {
  if (pick.branch === 'asi') return isValidAsiDistribution(pick.payload)
  if (pick.featureId == null) return { ok: false, reason: 'Aucun don sélectionné.' }
  return { ok: true }
}

/** Forme d'un choix composite, pour l'UI (rendu du sélecteur de répartition / de branche). */
export type CompositeShape =
  | { kind: 'ability_scores', abilities: AbilityKey[], distributions: AbilityDistribution[] }
  | { kind: 'asi_or_feat', asiDistributions: readonly AsiDistribution[], featCategory?: string }

/**
 * Décrit la forme composite d'un point de choix depuis son `kind` + `optionSource`, ou `null` si
 * c'est un « choisir N dans une liste » classique (options discrètes, rendues via `options[]`).
 * Pur : lu par l'UI pour savoir quel sélecteur afficher.
 */
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
