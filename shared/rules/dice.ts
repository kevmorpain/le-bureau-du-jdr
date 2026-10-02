// Expression de dés d'un objet (`items.recharge_dice`) : « 1d6+4 ».
export const DICE_EXPRESSION = /^(\d+)d(\d+)([+-]\d+)?$/

export interface ParsedDice {
  count: number
  sides: number
  modifier: number
}

export const parseDice = (expression: string): ParsedDice | null => {
  const m = expression.match(DICE_EXPRESSION)
  return m ? { count: Number(m[1]), sides: Number(m[2]), modifier: m[3] ? Number(m[3]) : 0 } : null
}

// `rng` : tirage uniforme dans [0, 1[, injectable pour les tests.
export const rollDice = (expression: string, rng: () => number): number => {
  const { count, sides, modifier } = parseDice(expression) ?? { count: 1, sides: 6, modifier: 0 }
  let total = modifier
  for (let i = 0; i < count; i++) total += Math.floor(rng() * sides) + 1
  return total
}
