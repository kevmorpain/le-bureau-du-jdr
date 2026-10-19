import { FEATURE_PICK_KINDS, type ChoiceKind } from './choices'
import type { ResolvedChoice } from './resolve'

export interface FeaturePick {
  progressionId: number
  featureId: number
}

/** Une option déjà prise que le joueur échange contre une nouvelle, en apprenant celle-ci (manœuvres). */
export type FeatureReplacement = FeaturePick

export const isFeaturePickChoice = (c: Pick<ResolvedChoice, 'kind'>): boolean =>
  (FEATURE_PICK_KINDS as readonly ChoiceKind[]).includes(c.kind)

export const optionFeatureIds = (c: Pick<ResolvedChoice, 'options'>): number[] =>
  c.options.flatMap(o => o.featureId != null ? [o.featureId] : [])

const groupByProgression = <T extends FeaturePick>(items: T[]): Map<number, T[]> => {
  const byProgression = new Map<number, T[]>()
  for (const item of items) byProgression.set(item.progressionId, [...(byProgression.get(item.progressionId) ?? []), item])
  return byProgression
}

/**
 * Premier pick illégal pour ce personnage, ou `null`. `owned` : les features que la fiche porte déjà (ou reçoit dans la même
 * requête par un autre chemin) ; une option ne se prend pas deux fois, même par deux points de choix (le 2ᵉ style de combat
 * doit différer du premier). Un point de choix `replaceable` dont le niveau donne de nouvelles options permet d'en échanger une :
 * le remplacement ajoute une option à apprendre.
 */
export function featurePicksError(
  picks: FeaturePick[],
  choices: ResolvedChoice[],
  owned: ReadonlySet<number>,
  replacements: FeatureReplacement[] = [],
): string | null {
  const picksBy = groupByProgression(picks)
  const replacementsBy = groupByProgression(replacements)

  for (const [progressionId, group] of replacementsBy) {
    const choice = choices.find(c => c.progressionId === progressionId)
    if (!choice || !isFeaturePickChoice(choice) || !choice.replaceable) return `Le point de choix (id=${progressionId}) n'autorise pas de remplacement.`
    if (group.length > 1) return `Un seul remplacement par point de choix (id=${progressionId}).`
    if (choice.remaining <= 0) return `Aucune option à apprendre sur le point de choix (id=${progressionId}) : rien à remplacer.`
    if (!owned.has(group[0]!.featureId)) return `L'option remplacée (id=${group[0]!.featureId}) n'est pas sur la fiche.`
    if (!picksBy.has(progressionId)) return `Un remplacement exige une nouvelle option (point de choix id=${progressionId}).`
  }

  for (const [progressionId, group] of picksBy) {
    const choice = choices.find(c => c.progressionId === progressionId)
    if (!choice || !isFeaturePickChoice(choice)) return `Le point de choix (id=${progressionId}) n'est pas proposé à ce personnage.`
    const due = choice.remaining + (replacementsBy.get(progressionId)?.length ?? 0)
    if (group.length > due) return `Trop de choix pour le point de choix (id=${progressionId}) : ${group.length} pour ${due} restant(s).`

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
