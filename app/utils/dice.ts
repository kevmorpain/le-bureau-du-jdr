export const parseDie = (value: string): { count: number, die: number } => {
  // Expects value like "2d8", "1d6", etc. or just a number like "5"
  const match = value.match(/^(\d+)d(\d+)$/)

  if (!match) {
    return { count: Number(value), die: 1 }
  }

  return {
    count: Number(match[1]!),
    die: Number(match[2]!),
  }
}

export function closestLevel(list: number[], level: number): number | undefined {
  const filtered = list.filter(n => n <= level)

  return filtered.length > 0 ? Math.max(...filtered) : undefined
}
