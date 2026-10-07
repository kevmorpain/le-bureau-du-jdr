import type { KnRollMode } from './resolve'
import { knRollDie, type KnRng } from './run'
import { KN_RESISTANCE_KEYS, KN_SKILL_KEYS, KN_WEAPON_SKILL_KEYS } from './skills'

export const KN_DIFFICULTY_KEYS = ['childsPlay', 'effortless', 'easy', 'normal', 'demanding', 'hard', 'impossible'] as const

export type KnDifficultyKey = (typeof KN_DIFFICULTY_KEYS)[number]

export const KN_DIFFICULTIES: Record<KnDifficultyKey, number> = {
  childsPlay: 30,
  effortless: 20,
  easy: 10,
  normal: 0,
  demanding: -10,
  hard: -20,
  impossible: -30,
}

const D8_DIFFICULTIES: readonly KnDifficultyKey[] = [
  'childsPlay',
  'effortless',
  'easy',
  'normal',
  'normal',
  'demanding',
  'hard',
  'impossible',
]

export const knRollDifficulty = (rng: KnRng = Math.random): KnDifficultyKey => D8_DIFFICULTIES[knRollDie(8, rng) - 1]!

// Un D100 se lit en deux chiffres ; 100 est le « 00 » du dé.
export function knD100Digits(roll: number) {
  const reading = roll === 100 ? 0 : roll
  return { tens: Math.floor(reading / 10), ones: reading % 10 }
}

const valueOf = (tens: number, ones: number) => tens * 10 + ones || 100

// Avantage : le plus petit chiffre en dizaines si cela aide ; Désavantage : le plus grand si cela gêne.
export function knReadD100(roll: number, mode: Exclude<KnRollMode, 'both'>) {
  const { tens, ones } = knD100Digits(roll)
  const swapped = valueOf(ones, tens)
  const better = mode === 'advantage' ? swapped < roll : mode === 'disadvantage' ? swapped > roll : false
  return { value: better ? swapped : roll, swapped: better }
}

export interface KnD100Input {
  roll: number
  score: number
  difficulty: number
  // Avantage et Désavantage ensemble : le livre ne dit pas comment les combiner, le jet est lu normalement.
  mode: KnRollMode
}

export interface KnD100Result {
  roll: number
  value: number
  swapped: boolean
  mode: Exclude<KnRollMode, 'both'>
  target: number
  success: boolean
  doubles: boolean
  critical: 'success' | 'failure' | null
}

export function knD100Check({ roll, score, difficulty, mode }: KnD100Input): KnD100Result {
  const reading = mode === 'both' ? 'normal' : mode
  const { value, swapped } = knReadD100(roll, reading)
  const target = Math.max(0, score + difficulty)
  const success = value <= target
  const { tens, ones } = knD100Digits(value)
  const doubles = tens === ones
  return { roll, value, swapped, mode: reading, target, success, doubles, critical: doubles ? (success ? 'success' : 'failure') : null }
}

export type KnCriticalKind = 'weapon' | 'table' | null

const WEAPON_KEYS: readonly string[] = KN_WEAPON_SKILL_KEYS
const TABLE_KEYS: readonly string[] = [...KN_SKILL_KEYS, ...KN_RESISTANCE_KEYS].filter(key => !WEAPON_KEYS.includes(key))

// Les compétences d'arme ont un Coup critique et une table de Maladresses ; les autres, un effet par test ;
// une compétence ajoutée à la main n'a ni l'un ni l'autre.
export function knCriticalKind(key: string | undefined): KnCriticalKind {
  if (key === undefined) return null
  if (WEAPON_KEYS.includes(key)) return 'weapon'
  return TABLE_KEYS.includes(key) ? 'table' : null
}

export type KnCriticalEffect
  = | { type: 'exhaustion' | 'health' | 'toughness' | 'sanity', amount: number, dice?: string }
    | { type: 'damage', amount: number, dice: string }
    | { type: 'usageDieUp' }

// Seuls les effets chiffrés sont appliqués ; les bonus à la prochaine action restent du texte.
export function knCriticalEffects(key: string | undefined, critical: 'success' | 'failure', rng: KnRng = Math.random): KnCriticalEffect[] {
  const die = (sides: number) => knRollDie(sides, rng)

  switch (`${key}.${critical}`) {
    case 'endurance.success': {
      const roll = die(4)
      return [{ type: 'health', amount: 1 }, { type: 'exhaustion', amount: -roll, dice: `D4 : ${roll}` }]
    }
    case 'endurance.failure':
    case 'athletics.failure': {
      const roll = die(4)
      return [{ type: 'exhaustion', amount: roll, dice: `D4 : ${roll}` }]
    }
    case 'resolve.success': {
      const roll = die(4)
      return [{ type: 'sanity', amount: roll + 1, dice: `D4+1 : ${roll}+1` }]
    }
    case 'resolve.failure': {
      const roll = die(4)
      return [{ type: 'sanity', amount: -roll, dice: `D4 : ${roll}` }]
    }
    case 'medicine.success': {
      const roll = die(10)
      return [{ type: 'toughness', amount: roll, dice: `D10 : ${roll}` }]
    }
    case 'medicine.failure': {
      const first = die(6)
      const second = die(6)
      return [{ type: 'damage', amount: first + second, dice: `2D6 : ${first} + ${second}` }]
    }
    case 'acrobatics.failure': {
      const roll = die(6)
      return [{ type: 'damage', amount: roll, dice: `D6 : ${roll}` }]
    }
    case 'reason.failure':
      return [{ type: 'usageDieUp' }]
    default:
      return []
  }
}

export interface KnVitalsState {
  toughness: number
  toughnessMax: number
  health: number
  healthMax: number
  sanity: number
  sanityMax: number
  exhaustion: number
  exhaustionMax: number
}

// Un gain ne ramène pas sous sa valeur actuelle une jauge déjà au-dessus de son maximum ; une perte s'arrête à 0.
const adjust = (current: number, amount: number, max: number) =>
  amount >= 0 ? Math.max(current, Math.min(max, current + amount)) : Math.max(0, current + amount)

// Les dégâts se retirent à la Robustesse d'abord, puis à la Santé, sans compter l'armure que le livre ne mentionne pas ici.
export function knApplyCriticalEffects(effects: KnCriticalEffect[], state: KnVitalsState): KnVitalsState {
  const next = { ...state }
  for (const effect of effects) {
    if (effect.type === 'health') next.health = adjust(next.health, effect.amount, next.healthMax)
    else if (effect.type === 'toughness') next.toughness = adjust(next.toughness, effect.amount, next.toughnessMax)
    else if (effect.type === 'sanity') next.sanity = adjust(next.sanity, effect.amount, next.sanityMax)
    else if (effect.type === 'exhaustion') next.exhaustion = adjust(next.exhaustion, effect.amount, next.exhaustionMax)
    else if (effect.type === 'damage') {
      const absorbed = Math.min(next.toughness, effect.amount)
      next.toughness -= absorbed
      next.health = Math.max(0, next.health - (effect.amount - absorbed))
    }
  }
  return next
}

export const KN_FUMBLE_DIE = 10
export const KN_FUMBLE_COUNT = 10

export const knRollFumble = (rng: KnRng = Math.random) => knRollDie(KN_FUMBLE_DIE, rng)
