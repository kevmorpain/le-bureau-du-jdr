import type { Ref } from 'vue'
import type { KnCharacter } from '~~/server/utils/drizzle'
import { knClearCombatEffects } from '~~/shared/ker-nethalas/combatEffects'
import { knFearLoss, knFindCreature, type KnCreature } from '~~/shared/ker-nethalas/creatures'
import type { KnResolvedSheet } from '~~/shared/ker-nethalas/resolve'
import { knFlee, knLocationVisit, knPreviousRoomIndex, knResumeCombat } from '~~/shared/ker-nethalas/run'

// Fuir un combat, puis le reprendre en revenant : les créatures vivantes restent dans la pièce, leur Santé remise à fond.
export function useKnFlee(character: Ref<KnCharacter>, resolved: () => KnResolvedSheet, bestiary: () => KnCreature[] | null) {
  const toast = useToast()
  const { enter } = useKnVisitEntry(character, resolved)

  const canFlee = computed(() => !!character.value.run.combat && knPreviousRoomIndex(character.value.run) !== undefined)

  // Après un test d'Esquive réussi : le combat s'arrête et le survivant repasse dans la pièce précédente.
  function flee() {
    const c = character.value
    const back = knPreviousRoomIndex(c.run)
    if (!c.run.combat || back === undefined) return
    c.status = knClearCombatEffects(c.status)
    c.run = knFlee(c.run)
    enter('revisit', undefined, undefined, back)
    toast.add({ title: 'Le survivant fuit', description: 'Il repasse dans la pièce précédente ; les créatures l\'attendent, à pleine Santé.', color: 'info' })
  }

  function resume() {
    const fled = knLocationVisit(character.value.run)?.fled
    if (!fled) return
    const creatures = fled.creatures.flatMap(creature => knFindCreature(bestiary(), creature.ref) ?? [])
    character.value.run = knResumeCombat(character.value.run, knFearLoss(creatures))
  }

  return { canFlee, flee, resume }
}
