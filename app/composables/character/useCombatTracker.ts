import { StorageSerializers, useStorage } from '@vueuse/core'

export interface InitiativeRecord {
  total: number
  natural: number
}

// État de rencontre d'un personnage (comme conditions et jets de mort) : dans le navigateur, pas en base.
export const useCombatTracker = (characterId: number | undefined) => {
  // Un défaut `null` ferait choisir à VueUse le sérialiseur « any » (`String(v)`) : l'objet s'écrirait « [object Object] ».
  const initiative = useStorage<InitiativeRecord | null>(characterStorageKey(characterId, 'initiative'), null, undefined, { serializer: StorageSerializers.object })
  const round = useStorage<number>(characterStorageKey(characterId, 'round'), 1)

  const reset = () => {
    initiative.value = null
    round.value = 1
  }
  const nextRound = () => {
    round.value += 1
  }
  const previousRound = () => {
    round.value = Math.max(1, round.value - 1)
  }

  return { initiative, round, reset, nextRound, previousRound }
}
