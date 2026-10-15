import { KN_MADNESS_COUNTER_KEYS, KN_MADNESS_D10, type KnMadness, type KnMadnessCounterKey } from './catalog/madness'
import { KN_STATUS_BOUNDS } from './status'

export type KnMadnessOutcome
  = | { kind: 'death' }
    | { kind: 'counter', key: KnMadnessCounterKey }
    | { kind: 'lostSkill' }
    | { kind: 'damage' }
    | { kind: 'xp' }

export const KN_MADNESS_DAMAGE = { count: 2, sides: 6, bonus: 0 } as const
export const KN_MADNESS_XP = 100

const DAMAGE_RESULT = 9

export const knMadnessRollModifier = (madness: KnMadness) => -madness.counters.fragileMind

export function knMadnessOutcome(result: number): KnMadnessOutcome {
  if (result <= 1) return { kind: 'death' }
  if (result === DAMAGE_RESULT) return { kind: 'damage' }
  if (result > DAMAGE_RESULT) return { kind: 'xp' }
  if (result === KN_MADNESS_D10.lostSkill) return { kind: 'lostSkill' }
  return { kind: 'counter', key: KN_MADNESS_COUNTER_KEYS.find(key => KN_MADNESS_D10[key] === result)! }
}

function withOutcome(madness: KnMadness, outcome: KnMadnessOutcome): KnMadness {
  if (outcome.kind === 'counter') {
    const count = Math.min(KN_STATUS_BOUNDS.counter.max, madness.counters[outcome.key] + 1)
    return { ...madness, counters: { ...madness.counters, [outcome.key]: count } }
  }
  if (outcome.kind === 'lostSkill' && madness.lostSkills.length < KN_STATUS_BOUNDS.lostSkills) {
    return { ...madness, lostSkills: [...madness.lostSkills, {}] }
  }
  return madness
}

// Un tirage sur la table de Folie : « Esprit fragile » retire 1 par cumul au D10, et seuls les résultats qui se gardent
// (2 à 8) changent la fiche ; la mort, les dégâts et l'XP se jouent à part.
export function knDrawMadness(madness: KnMadness, roll: number) {
  const modified = roll + knMadnessRollModifier(madness)
  const outcome = knMadnessOutcome(modified)
  return { roll, modified, outcome, madness: withOutcome(madness, outcome) }
}
