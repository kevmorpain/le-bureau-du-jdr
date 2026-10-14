import type { KnObstacle } from './run'

// L'expérience que le livre rapporte (p. 63), à un seul endroit.
export const KN_XP = {
  combat: 50,
  overseer: 200,
  lockOpened: 10,
  trapDisarmed: 10,
  newDomain: 50,
  loreBook: 10,
} as const

export type KnXpSource = keyof typeof KN_XP

export interface KnXpGain {
  source: KnXpSource
  amount: number
}

// Un verrou qui s'ouvre, un piège qu'on désamorce : l'XP ne se gagne qu'au passage d'un état à l'autre, jamais deux fois pour le
// même obstacle. Un piège contourné ne rapporte rien, le livre dit « désamorcer ».
export function knObstacleXp(before: KnObstacle | undefined, after: KnObstacle | undefined): KnXpGain[] {
  if (!before || !after) return []
  return [
    ...(!before.lockOpen && after.lockOpen ? [{ source: 'lockOpened' as const, amount: KN_XP.lockOpened }] : []),
    ...(before.trapState !== 'disarmed' && after.trapState === 'disarmed' ? [{ source: 'trapDisarmed' as const, amount: KN_XP.trapDisarmed }] : []),
  ]
}
