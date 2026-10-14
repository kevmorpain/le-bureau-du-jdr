import type { Ref } from 'vue'
import type { KnCharacter } from '~~/server/utils/drizzle'

// Les événements de l'Obscurité Grandissante arrivent de plusieurs endroits (Dé de Tension, vacarme, tables d'événements, ajout à la
// main) : on les compte là où ils se retrouvent tous, dans le Domaine courant. Un changement de Domaine n'en ajoute aucun.
// À appeler une seule fois, depuis la page.
export function useKnDarknessGoal(character: Ref<KnCharacter | null | undefined>) {
  const { record } = useKnGoalProgress(character as Ref<KnCharacter>)

  const state = computed(() => {
    const run = character.value?.run
    return run ? { current: run.current, count: run.domains[run.current]?.growingDarkness.length ?? 0 } : undefined
  })

  watch(state, (next, previous) => {
    if (!next || !previous || next.current !== previous.current || next.count <= previous.count) return
    record(...Array.from({ length: next.count - previous.count }, () => ({ kind: 'darkness' as const })))
  })
}
