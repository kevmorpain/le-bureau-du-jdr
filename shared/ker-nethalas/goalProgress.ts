import { knGoalIncrement, type KnGoalEvent } from './goalCounts'
import { KN_GOAL_BOUNDS, type KnGoalPick, type KnPersonalGoal } from './goals'

export interface KnGoalProgressResult {
  picks: KnGoalPick[]
  // Les objectifs dont la cible vient d'être atteinte.
  reached: string[]
}

// Les événements de la partie font avancer les objectifs en cours qui savent compter ce qu'ils décrivent ; les autres restent
// à la main. Un objectif récupéré ne bouge plus, et le progrès ne dépasse pas son plafond.
export function knApplyGoalEvents(
  picks: readonly KnGoalPick[],
  goals: readonly KnPersonalGoal[],
  events: readonly KnGoalEvent[],
): KnGoalProgressResult {
  const reached: string[] = []
  const next = picks.map((pick) => {
    const goal = goals.find(candidate => candidate.key === pick.key)
    if (!goal?.counts || pick.claimed) return pick
    const gained = events.reduce((total, event) => total + knGoalIncrement(goal.counts!, event), 0)
    if (gained <= 0) return pick
    const progress = Math.min(KN_GOAL_BOUNDS.progress.max, pick.progress + gained)
    if (pick.progress < goal.target && progress >= goal.target) reached.push(pick.key)
    return { ...pick, progress }
  })
  return { picks: next, reached }
}
