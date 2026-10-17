import type { KnDice } from './dice'
import type { KnDamageType } from './catalog/damageTypes'

// Le mouvement défensif du survivant (D10, après une défense réussie) : ce que l'outil applique tout seul, sur la prochaine
// attaque du survivant, sur l'adversaire ou sur le survivant. Les résultats sur les conditions restent du texte.
export type KnSurvivorMoveEffect
  = | { kind: 'nextAttack', bonus?: number, dice?: { dice: KnDice, type?: KnDamageType }[], advantage?: boolean, freeAim?: boolean }
    | { kind: 'armorLoss', points: number }
    | { kind: 'foeBleeding', value: number }
    | { kind: 'immunity' }
    | { kind: 'piercing', amount: number }
    | { kind: 'foeDefense', amount: number }
    | { kind: 'recover', vital: 'toughness', amount: number }
    | { kind: 'text' }

export const KN_SURVIVOR_MOVE_BONUS = 10

const MOVES: Record<number, KnSurvivorMoveEffect> = {
  1: { kind: 'nextAttack', bonus: KN_SURVIVOR_MOVE_BONUS },
  2: { kind: 'armorLoss', points: 1 },
  3: { kind: 'foeBleeding', value: 1 },
  4: { kind: 'immunity' },
  5: { kind: 'piercing', amount: 1 },
  6: { kind: 'nextAttack', dice: [{ dice: { count: 1, sides: 6, bonus: 0 } }] },
  7: { kind: 'nextAttack', advantage: true },
  8: { kind: 'foeDefense', amount: 20 },
  9: { kind: 'recover', vital: 'toughness', amount: 2 },
  10: { kind: 'nextAttack', freeAim: true },
}

export const knSurvivorMove = (roll: number): KnSurvivorMoveEffect => MOVES[roll] ?? { kind: 'text' }
