import type { ResolvedChoice } from './resolve'

// Historiques : « Si un personnage gagne une même maîtrise de deux sources différentes, il peut choisir
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

export interface DuplicateSources {
  speciesSkills: string[]
  backgroundSkills: string[]
  /** Une entrée par classe : maîtrises de départ de la 1re, sous-ensemble de multiclassage des classes rejointes. */
  classTools: string[][]
  backgroundTools: string[]
}

export interface DuplicateCounts { skills: number, tools: number }

export function proficiencyDuplicates(s: DuplicateSources): DuplicateCounts {
  return {
    skills: duplicateCount(s.speciesSkills, s.backgroundSkills),
    tools: duplicateCount(...s.classTools, s.backgroundTools),
  }
}

export interface LevelUpReplacements {
  choices: ResolvedChoice[]
  /** Maîtrises que la classe rejointe vient de doubler, pour l'expliquer au joueur. */
  duplicated: { skills: string[], tools: string[] }
}

// `choices` : points de choix de remplacement résolus sur les doublons d'APRÈS le level-up, avec les picks déjà
// enregistrés. Les doublons d'avant, même non remplacés, ne sont pas redemandés : seul le surplus l'est.
export function replacementsDueAtLevelUp(choices: ResolvedChoice[], before: DuplicateCounts): ResolvedChoice[] {
  return choices.flatMap((c) => {
    const due = Math.max(0, c.count - Math.max(c.kind === 'skill' ? before.skills : before.tools, c.made))
    return due > 0 ? [{ ...c, count: due, made: 0, remaining: due }] : []
  })
}
