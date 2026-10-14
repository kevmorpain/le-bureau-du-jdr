import { knIsUsedUp, knMarkUsed } from './masteryEffects'
import { knRollDie, type KnRng } from './run'
import type { KnStatus } from './status'

export const KN_BANDAGE = { key: 'bandage', die: 4 } as const

export interface KnBandageInput {
  toughness: number
  toughnessMax: number
  bandages: number
  status: KnStatus
}

export type KnBandageResult
  = | { error: 'noBandage' | 'usedThisRoom' }
    | { toughness: number, bandages: number, status: KnStatus, roll: number }

// Hors combat, un Bandage et un test de Médecine réussi soignent D4 Robustesse, une seule fois par salle, sans déborder sur la
// Santé. L'appelant ne l'appelle qu'après la réussite du test.
export function knUseBandage(input: KnBandageInput, rng: KnRng = Math.random): KnBandageResult {
  if (input.bandages < 1) return { error: 'noBandage' }
  if (knIsUsedUp(input.status, KN_BANDAGE.key)) return { error: 'usedThisRoom' }
  const roll = knRollDie(KN_BANDAGE.die, rng)
  return {
    toughness: Math.max(input.toughness, Math.min(input.toughnessMax, input.toughness + roll)),
    bandages: input.bandages - 1,
    status: knMarkUsed(input.status, KN_BANDAGE.key, 'room'),
    roll,
  }
}
