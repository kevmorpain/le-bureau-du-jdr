export function profBonusAtLevel(level: number): number {
  return Math.ceil(level / 4) + 1
}

export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2)
}

export function formatMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : String(mod)
}

/** PV « moyens fixes » : max au niv. 1, puis (⌈dé/2⌉ + 1 + mod CON) par niveau suivant. */
export function hpAtLevel(hitDie: number, level: number, conMod: number): number {
  if (level <= 0) return 0
  const firstLevel = hitDie + conMod
  const additionalLevels = (level - 1) * (Math.ceil(hitDie / 2) + 1 + conMod)
  return firstLevel + additionalLevels
}
