export const COIN_KEYS = ['pp', 'po', 'pe', 'pa', 'pc'] as const

export type CoinKey = typeof COIN_KEYS[number]

export type Purse = Record<CoinKey, number>

export const COIN_VALUE_CP: Record<CoinKey, number> = { pp: 1000, po: 100, pe: 50, pa: 10, pc: 1 }

export const COIN_WEIGHT_G = 10

export const coinCount = (purse: Partial<Purse>): number => COIN_KEYS.reduce((sum, key) => sum + (purse[key] ?? 0), 0)

export const purseValueCp = (purse: Partial<Purse>): number => COIN_KEYS.reduce((sum, key) => sum + (purse[key] ?? 0) * COIN_VALUE_CP[key], 0)

// Le prix s'écrit dans la plus grande pièce qui le rend exactement, comme le donnent les tables d'équipement.
export function formatCostCp(costCp: number): string {
  if (costCp % COIN_VALUE_CP.po === 0) return `${costCp / COIN_VALUE_CP.po} po`
  if (costCp % COIN_VALUE_CP.pa === 0) return `${costCp / COIN_VALUE_CP.pa} pa`
  return `${costCp} pc`
}
