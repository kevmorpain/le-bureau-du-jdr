import { knRollDamagePool } from './combat'
import type { KnRng } from './run'
import type { KnStatus } from './status'

export interface KnCombatTick {
  name: string
  direct: boolean
  roll: number
}

// Un round qui passe : chaque effet de combat actif inflige ses dégâts de début de tour (le dé le plus haut, comme tout
// adversaire), puis perd un round ; à zéro, il disparaît.
export function knAdvanceCombatEffects(status: KnStatus, rng: KnRng = Math.random): { status: KnStatus, ticks: KnCombatTick[], expired: string[] } {
  const ticks: KnCombatTick[] = []
  const expired: string[] = []
  const custom = status.custom.flatMap((modifier) => {
    if (!modifier.combat || !modifier.active) return [modifier]
    if (modifier.tick) ticks.push({ name: modifier.name, direct: !!modifier.tick.direct, roll: knRollDamagePool([modifier.tick.dice], rng).total })
    if (modifier.rounds === undefined) return [modifier]
    if (modifier.rounds <= 1) {
      expired.push(modifier.name)
      return []
    }
    return [{ ...modifier, rounds: modifier.rounds - 1 }]
  })
  const changed = custom.length !== status.custom.length || custom.some((modifier, i) => modifier !== status.custom[i])
  return { status: changed ? { ...status, custom } : status, ticks, expired }
}

// Entrer dans une salle : un effet à durée en salles en perd une ; celui qui n'en avait plus cesse.
export function knAdvanceRooms(status: KnStatus): { status: KnStatus, expired: string[] } {
  const expired: string[] = []
  const custom = status.custom.flatMap((modifier) => {
    if (modifier.rooms === undefined) return [modifier]
    if (modifier.rooms === 0) {
      expired.push(modifier.name)
      return []
    }
    return [{ ...modifier, rooms: modifier.rooms - 1 }]
  })
  return { status: status.custom.some(modifier => modifier.rooms !== undefined) ? { ...status, custom } : status, expired }
}

// La fin du combat retire tous les effets que ses créatures avaient posés.
export const knClearCombatEffects = (status: KnStatus): KnStatus =>
  status.custom.some(modifier => modifier.combat) ? { ...status, custom: status.custom.filter(modifier => !modifier.combat) } : status
