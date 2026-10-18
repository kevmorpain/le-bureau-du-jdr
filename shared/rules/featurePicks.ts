import { FEATURE_PICK_KINDS, type ChoiceKind } from './choices'
import type { ResolvedChoice } from './resolve'

export interface FeaturePick {
  progressionId: number
  featureId: number
}

export const isFeaturePickChoice = (c: Pick<ResolvedChoice, 'kind'>): boolean =>
  (FEATURE_PICK_KINDS as readonly ChoiceKind[]).includes(c.kind)

export const optionFeatureIds = (c: Pick<ResolvedChoice, 'options'>): number[] =>
  c.options.flatMap(o => o.featureId != null ? [o.featureId] : [])

/**
 * Premier pick illégal pour ce personnage, ou `null`. `owned` : les features que la fiche porte déjà (ou reçoit dans la même
 * requête par un autre chemin) ; une option ne se prend pas deux fois, même par deux points de choix (le 2ᵉ style de combat
 * doit différer du premier).
 */
export function featurePicksError(picks: FeaturePick[], choices: ResolvedChoice[], owned: ReadonlySet<number>): string | null {
  const byProgression = new Map<number, FeaturePick[]>()
  for (const pick of picks) byProgression.set(pick.progressionId, [...(byProgression.get(pick.progressionId) ?? []), pick])

  for (const [progressionId, group] of byProgression) {
    const choice = choices.find(c => c.progressionId === progressionId)
    if (!choice || !isFeaturePickChoice(choice)) return `Le point de choix (id=${progressionId}) n'est pas proposé à ce personnage.`
    if (group.length > choice.remaining) return `Trop de choix pour le point de choix (id=${progressionId}) : ${group.length} pour ${choice.remaining} restant(s).`

    const featureIds = group.map(p => p.featureId)
    if (new Set(featureIds).size !== featureIds.length) return `Le même choix est fait deux fois (point de choix id=${progressionId}).`
    const allowed = new Set(choice.options.map(o => o.featureId))
    const bad = featureIds.find(id => !allowed.has(id))
    if (bad != null) return `L'option (id=${bad}) n'est pas proposée par le point de choix (id=${progressionId}).`
    const again = featureIds.find(id => owned.has(id))
    if (again != null) return `L'option (id=${again}) est déjà prise par ce personnage.`
  }
  return null
}
