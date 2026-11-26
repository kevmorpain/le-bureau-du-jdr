import { StorageSerializers, useStorage } from '@vueuse/core'

export interface InitiativeRecord {
  total: number
  natural: number
}

export const TURN_ACTIONS = ['action', 'bonus_action', 'reaction'] as const
export type TurnAction = typeof TURN_ACTIONS[number]
export type UsedActions = Record<TurnAction, boolean>

const MOVE_STEP = 1.5

const freshActions = (): UsedActions => ({ action: false, bonus_action: false, reaction: false })

// État de rencontre d'un personnage (comme conditions et jets de mort) : dans le navigateur, pas en base.
export const useCombatTracker = (characterId: number | undefined) => {
  // Un défaut `null` ferait choisir à VueUse le sérialiseur « any » (`String(v)`) : l'objet s'écrirait « [object Object] ».
  const initiative = useStorage<InitiativeRecord | null>(characterStorageKey(characterId, 'initiative'), null, undefined, { serializer: StorageSerializers.object, initOnMounted: true })
  const round = useStorage<number>(characterStorageKey(characterId, 'round'), 1, undefined, { initOnMounted: true })
  const isActive = useStorage<boolean>(characterStorageKey(characterId, 'combat'), false, undefined, { initOnMounted: true })
  const movementUsed = useStorage<number>(characterStorageKey(characterId, 'movement'), 0, undefined, { initOnMounted: true })
  const usedActions = useStorage<UsedActions>(characterStorageKey(characterId, 'actions'), freshActions(), undefined, { mergeDefaults: true, initOnMounted: true })
  const lapseAsked = useStorage<number[]>(characterStorageKey(characterId, 'lapse'), [], undefined, { initOnMounted: true })

  const resetTurn = () => {
    usedActions.value = freshActions()
    movementUsed.value = 0
  }
  const reset = () => {
    initiative.value = null
    round.value = 1
    isActive.value = false
    lapseAsked.value = []
    resetTurn()
  }
  const start = (record: InitiativeRecord | null) => {
    reset()
    initiative.value = record
    isActive.value = true
  }
  const nextRound = () => {
    round.value += 1
  }
  const previousRound = () => {
    round.value = Math.max(1, round.value - 1)
  }
  const toggleAction = (action: TurnAction) => {
    usedActions.value = { ...usedActions.value, [action]: !usedActions.value[action] }
  }
  // Dashing doubles the turn's movement: up to twice the speed.
  const moveBy = (steps: number, speed: number) => {
    movementUsed.value = Math.max(0, Math.min(speed * 2, movementUsed.value + steps * MOVE_STEP))
  }

  return { initiative, round, isActive, movementUsed, usedActions, lapseAsked, reset, start, resetTurn, nextRound, previousRound, toggleAction, moveBy }
}
