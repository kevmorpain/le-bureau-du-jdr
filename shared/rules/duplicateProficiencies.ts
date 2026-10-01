// AideDD, Historiques : « Si un personnage gagne une même maîtrise de deux sources différentes, il peut choisir
// une autre maîtrise de même nature (compétence ou outil) à la place. » Seules comptent les sources FIXES : un
// doublon venu d'un choix s'évite en changeant ce choix.

function occurrences(sources: string[][]): Map<string, number> {
  const seen = new Map<string, number>()
  for (const source of sources) for (const value of new Set(source)) seen.set(value, (seen.get(value) ?? 0) + 1)
  return seen
}

/** Maîtrises accordées par plus d'une source, une fois chacune. */
export function duplicatedValues(...sources: string[][]): string[] {
  return [...occurrences(sources)].filter(([, n]) => n > 1).map(([value]) => value)
}

/** Remplacements dus : une maîtrise reçue de N sources en ouvre N − 1. */
export function duplicateCount(...sources: string[][]): number {
  return [...occurrences(sources).values()].reduce((n, count) => n + count - 1, 0)
}
