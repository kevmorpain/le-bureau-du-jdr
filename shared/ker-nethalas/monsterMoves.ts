import type { KnDice } from './dice'

// Le mouvement défensif d'une créature (D10, quand elle pare l'attaque du survivant). Ce que l'outil sait appliquer l'est : son
// prochain coup (bonus, Avantage, dés) devient un effet d'une seule attaque ; le reste touche le survivant ou la créature. Quand
// l'effet dépend de la nature de l'action suivante (magique ou non), la mention reste dans le libellé de l'effet.
export type KnMonsterMoveEffect
  = | { kind: 'creatureBuff', buff: { label: string, combatSkill?: number, advantage?: 'attack', damageBonus?: KnDice, once: true } }
    | { kind: 'survivorArmorLoss', points: number }
    | { kind: 'survivorCondition', key: 'bleeding', value: number }
    | { kind: 'survivorPiercing', amount: number }
    | { kind: 'survivorDefense', amount: number }
    | { kind: 'creatureHeal', dice: KnDice }
    | { kind: 'text' }

const MOVES: Record<number, KnMonsterMoveEffect> = {
  1: { kind: 'creatureBuff', buff: { label: 'Défense réussie : prochaine attaque +10 (si magique : Résistance magique −10)', combatSkill: 10, once: true } },
  2: { kind: 'survivorArmorLoss', points: 1 },
  3: { kind: 'survivorCondition', key: 'bleeding', value: 1 },
  4: { kind: 'text' },
  5: { kind: 'survivorPiercing', amount: 1 },
  6: { kind: 'creatureBuff', buff: { label: 'Défense réussie : prochaine action de dégâts +D6 (sinon Résistance magique −10)', damageBonus: { count: 1, sides: 6, bonus: 0 }, once: true } },
  7: { kind: 'creatureBuff', buff: { label: 'Défense réussie : Avantage à la prochaine attaque (si magique : Résistance magique avec Désavantage)', advantage: 'attack', once: true } },
  8: { kind: 'survivorDefense', amount: -20 },
  9: { kind: 'creatureHeal', dice: { count: 1, sides: 4, bonus: 0 } },
  10: { kind: 'text' },
}

export const knMonsterMove = (roll: number): KnMonsterMoveEffect => MOVES[roll] ?? { kind: 'text' }
