import type { KnDamageType } from './catalog/damageTypes'
import type { KnConditionKey } from './catalog/conditions'
import type { KnDice } from './dice'

// Les maladresses (livre p. 84) : ce que l'outil applique tout seul. Ce qui dépend d'une action manuelle (récupérer une arme,
// se relever) reste du texte à lire.
export type KnSurvivorFumbleEffect
  = | { kind: 'weaponLost' }
    | { kind: 'weaponBreaks' }
    | { kind: 'beltBreaks' }
    | { kind: 'aetherLoss', dice: KnDice }
    | { kind: 'conditions', list: { key: KnConditionKey, value?: number }[] }
    | { kind: 'selfHit', critical: boolean, ally: boolean }

// Sans arme en main, la prochaine attaque subit −20 au lieu de perdre l'arme.
export const KN_UNARMED_FUMBLE_MALUS = -20

const SURVIVOR: Record<number, KnSurvivorFumbleEffect> = {
  1: { kind: 'weaponLost' },
  2: { kind: 'weaponLost' },
  3: { kind: 'weaponBreaks' },
  4: { kind: 'beltBreaks' },
  5: { kind: 'aetherLoss', dice: { count: 1, sides: 8, bonus: 0 } },
  6: { kind: 'conditions', list: [{ key: 'prone' }] },
  7: { kind: 'conditions', list: [{ key: 'prone' }, { key: 'dazed', value: 2 }] },
  8: { kind: 'selfHit', critical: false, ally: true },
  9: { kind: 'selfHit', critical: false, ally: false },
  10: { kind: 'selfHit', critical: true, ally: false },
}

export const knSurvivorFumble = (roll: number): KnSurvivorFumbleEffect => SURVIVOR[roll] ?? { kind: 'weaponLost' }

export interface KnMonsterFumbleBuff {
  label: string
  combatSkill?: number
  once?: true
  // Tours que la créature perd (Étourdie, À terre).
  lostTurn?: number
}

export type KnMonsterFumbleEffect
  = | { kind: 'creatureBuff', buff: KnMonsterFumbleBuff, rounds?: KnDice }
    | { kind: 'survivorDefenseAdvantage', rounds: number }
    | { kind: 'survivorCondition', key: KnConditionKey, rounds: KnDice }
    | { kind: 'creatureDamage', dice: KnDice, type: KnDamageType, buff?: KnMonsterFumbleBuff }

const d = (count: number, sides: number): KnDice => ({ count, sides, bonus: 0 })

const MONSTER: Record<number, KnMonsterFumbleEffect> = {
  1: { kind: 'creatureBuff', buff: { label: 'Maladresse : prochaine attaque −20 (si magique : Résistance magique +20)', combatSkill: -20, once: true } },
  2: { kind: 'creatureBuff', buff: { label: 'Étourdie : perd son prochain tour', lostTurn: 1 } },
  3: { kind: 'creatureBuff', buff: { label: 'Entravée', combatSkill: -20 }, rounds: d(1, 4) },
  4: { kind: 'survivorDefenseAdvantage', rounds: 2 },
  5: { kind: 'survivorCondition', key: 'concealed', rounds: d(1, 4) },
  6: { kind: 'creatureBuff', buff: { label: 'À terre : se relève à son prochain tour', lostTurn: 1 } },
  7: { kind: 'creatureBuff', buff: { label: 'À terre et Étourdie (2) : perd ses deux prochains tours', lostTurn: 2 } },
  8: { kind: 'creatureBuff', buff: { label: 'Effrayée (20)', combatSkill: -20 } },
  9: { kind: 'creatureDamage', dice: d(1, 6), type: 'slashing' },
  10: { kind: 'creatureDamage', dice: d(2, 6), type: 'bludgeoning', buff: { label: 'À terre : se relève à son prochain tour', lostTurn: 1 } },
}

export const knMonsterFumble = (roll: number): KnMonsterFumbleEffect => MONSTER[roll] ?? MONSTER[1]!
