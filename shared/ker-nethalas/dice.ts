import { z } from 'zod'
import { knRollDie, type KnRng } from './run'
import { boundedInt } from './zodHelpers'

// `count` dés à `sides` faces plus `bonus` ; un montant fixe s'écrit sans dé (`count` 0).
export const knDiceSchema = z.object({
  count: boundedInt({ min: 0, max: 20 }),
  sides: boundedInt({ min: 0, max: 100 }),
  bonus: boundedInt({ min: -99, max: 99 }),
}).refine(dice => dice.count === 0 || dice.sides >= 2, { message: 'un dé a au moins deux faces' })

export type KnDice = z.infer<typeof knDiceSchema>

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
