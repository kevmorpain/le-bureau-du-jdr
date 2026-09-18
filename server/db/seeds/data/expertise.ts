import type { ProgressionDef } from '../lib/seedClass'

// L'owner « Expertise » reste `class_feature` VISIBLE (contrairement aux owners de sous-classe/
// style, invisibles) : le pick n'est pas une feature matérialisée mais une compétence passée à
// `expert` (character_skills), résolue live contre les compétences déjà maîtrisées.

// Total CUMULATIF par niveau (`lookup`) — le level-up en dérive le delta. Roublard : 2 aux niv 1-5,
// 4 au niv 6+. Barde : 2 aux niv 3-9, 4 au niv 10+ ; les 0 de tête alignent l'index sur le niveau
// (l'accès reste gaté par le levelRequired de l'owner).
export const EXPERTISE_COUNT_BY_CLASS: Record<string, number[]> = {
  Roublard: [2, 2, 2, 2, 2, 4],
  Barde: [0, 0, 2, 2, 2, 2, 2, 2, 2, 4],
}

export const EXPERTISE_OWNER_NAME = 'Expertise'

export function expertiseProgression(className: string): ProgressionDef | null {
  const table = EXPERTISE_COUNT_BY_CLASS[className]
  if (!table) return null
  return {
    kind: 'expertise',
    count: { op: 'lookup', table },
    optionSource: { type: 'proficient_skills' },
    replaceable: false,
  }
}
