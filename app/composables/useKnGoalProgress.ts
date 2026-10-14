import type { Ref } from 'vue'
import type { KnCharacter } from '~~/server/utils/drizzle'
import type { KnGoalEvent } from '~~/shared/ker-nethalas/goalCounts'
import { knApplyGoalEvents } from '~~/shared/ker-nethalas/goalProgress'
import type { KnPersonalGoal } from '~~/shared/ker-nethalas/goals'

// Les événements de la partie font avancer, sans confirmation, les objectifs en cours qui savent les compter ; un message
// n'annonce que la cible atteinte. Le progrès reste corrigeable à la main dans la section Objectifs.
export function useKnGoalProgress(character: Ref<KnCharacter>) {
  const toast = useToast()
  const { data: goals } = useKnContent<KnPersonalGoal[]>('personalGoals')

  function record(...events: KnGoalEvent[]) {
    const known = goals.value
    if (!known || !events.length || !character.value.goalPicks.length) return
    const { picks, reached } = knApplyGoalEvents(character.value.goalPicks, known, events)
    if (picks.some((pick, index) => pick !== character.value.goalPicks[index])) character.value.goalPicks = picks
    for (const key of reached) {
      toast.add({ title: 'Objectif atteint', description: known.find(goal => goal.key === key)?.name ?? key, color: 'success' })
    }
  }

  return { record }
}
