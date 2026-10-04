import type { AbilityScoreKey, Effect } from '~~/server/db/schema/effects'

export interface UnarmoredDefense {
  base: number
  abilities: AbilityScoreKey[]
  total: number
}

const candidate = (base: number, abilities: AbilityScoreKey[], modifiers: Record<string, number>): UnarmoredDefense => ({
  base,
  abilities,
  total: base + abilities.reduce((sum, a) => sum + (modifiers[a] ?? 0), 0),
})

// AideDD, Barbare / Moine : on ne cumule pas plusieurs sources de CA sans armure, on retient la meilleure ;
// `10 + DEX` (la règle de base) reste toujours disponible.
export const bestUnarmoredDefense = (
  effects: readonly Effect[],
  modifiers: Record<string, number>,
  hasShield: boolean,
): UnarmoredDefense => {
  let best = candidate(10, ['dex'], modifiers)
  for (const e of effects) {
    if (e.type !== 'unarmored_defense' || (hasShield && !e.value.shield)) continue
    const option = candidate(e.value.base, e.value.abilities, modifiers)
    if (option.total > best.total) best = option
  }
  return best
}
