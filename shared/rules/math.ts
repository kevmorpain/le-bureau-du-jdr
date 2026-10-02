export function profBonusAtLevel(level: number): number {
  return Math.ceil(level / 4) + 1
}

export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2)
}

export function formatMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : String(mod)
}
