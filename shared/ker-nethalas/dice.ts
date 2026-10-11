import { knDiceSchema, type KnDice } from './diceSchema'
import { knRollDie, type KnRng } from './run'

export { knDiceSchema, type KnDice }

export interface KnDiceRoll {
  rolls: number[]
  total: number
}

export function knRollDice(dice: KnDice, rng: KnRng = Math.random): KnDiceRoll {
  const rolls = Array.from({ length: dice.count }, () => knRollDie(dice.sides, rng))
  return { rolls, total: Math.max(0, rolls.reduce((sum, roll) => sum + roll, dice.bonus)) }
}

export function knDiceLabel(dice: KnDice): string {
  if (dice.count === 0) return String(dice.bonus)
  const bonus = dice.bonus === 0 ? '' : dice.bonus > 0 ? `+${dice.bonus}` : String(dice.bonus)
  return `${dice.count === 1 ? '' : dice.count}D${dice.sides}${bonus}`
}

// Une réserve de dégâts saisie à la main : « D6 », « 2D8+1 », « D6 + D4 + 2 ». `null` si on n'y lit rien de valide.
export function knParseDicePool(text: string): KnDice[] | null {
  const tokens = text.replace(/\s+/g, '').toUpperCase().split('+').filter(Boolean)
  if (!tokens.length) return null
  const pool: KnDice[] = []
  for (const token of tokens) {
    const dice = /^(\d*)D(\d+)$/.exec(token)
    if (dice) pool.push({ count: dice[1] ? Number(dice[1]) : 1, sides: Number(dice[2]), bonus: 0 })
    else if (/^\d+$/.test(token)) pool.push({ count: 0, sides: 0, bonus: Number(token) })
    else return null
  }
  return pool.every(entry => knDiceSchema.safeParse(entry).success) ? pool : null
}
