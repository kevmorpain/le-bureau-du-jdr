import type { Ref } from 'vue'
import type { KnCharacter } from '~~/server/utils/drizzle'
import { knAdvanceRooms } from '~~/shared/ker-nethalas/combatEffects'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import { knStartVisit, type KnIntroEntry, type KnVisitKind } from '~~/shared/ker-nethalas/run'
import { knResetUses } from '~~/shared/ker-nethalas/vitals'

// Entrer dans une salle, un couloir ou une zone déjà explorée : l'entrée rejoint le chemin du Domaine, les usages « par salle » reviennent,
// les effets qui durent des salles avancent et l'Éther revient.
export function useKnVisitEntry(character: Ref<KnCharacter>, resolved: () => KnResolvedSheet) {
  const toast = useToast()

  function enter(kind: KnVisitKind, shapeRoll?: number, intro?: KnIntroEntry, target?: number) {
    const c = character.value
    c.run = knStartVisit(c.run, kind, shapeRoll, intro, target)
    c.status = knResetUses(c.status, ['room'])
    if (kind === 'room') {
      const { status, expired } = knAdvanceRooms(c.status)
      c.status = status
      if (expired.length) toast.add({ title: 'Effet terminé', description: expired.join(', '), color: 'neutral' })
    }
    c.aetherCurrent = resolved().maxVitals.aether.effective
  }

  return { enter }
}
