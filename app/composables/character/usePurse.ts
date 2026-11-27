import { COIN_KEYS, type CoinKey, type Purse } from '~~/shared/rules/currency'

export type PurseMode = 'gain' | 'spend'

export interface PurseMove { key: CoinKey, amount: number }

export const usePurse = (characterSheet: Ref<CharacterSheet>) => {
  const purse = computed<Purse>(() => Object.fromEntries(COIN_KEYS.map(key => [key, characterSheet.value[key] ?? 0])) as Purse)

  // Each coin is floored at 0 on its own: nothing makes change automatically.
  const applyMove = (mode: PurseMode, deltas: Partial<Record<CoinKey, number>>): PurseMove[] => {
    const sign = mode === 'spend' ? -1 : 1
    const moves = COIN_KEYS
      .map(key => ({ key, amount: Math.max(0, Math.floor(deltas[key] ?? 0)) }))
      .filter(move => move.amount > 0)
    if (!moves.length) return []
    const next = { ...characterSheet.value }
    for (const { key, amount } of moves) next[key] = Math.max(0, (characterSheet.value[key] ?? 0) + sign * amount)
    characterSheet.value = next
    return moves
  }

  const setCoin = (key: CoinKey, value: number) => {
    characterSheet.value = { ...characterSheet.value, [key]: Math.max(0, Math.floor(value)) }
  }

  return { purse, applyMove, setCoin }
}
