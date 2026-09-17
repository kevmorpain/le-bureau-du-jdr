import type { ProgressionDef } from '../lib/seedClass'

// ─────────────────────────────────────────────────────────────────────────────
// Expertise — point de choix `progression` (F2, « décision → choix »). Roublard et Barde
// choisissent 2 compétences maîtrisées à doubler, puis 2 autres à un palier ultérieur.
//
// Modélisé comme les invocations : UNE progression `kind:'expertise'` sur la feature owner
// « Expertise », avec un `count` CUMULATIF (table lookup) et `optionSource:{proficient_skills}`
// (résolu live contre les compétences déjà maîtrisées du perso). Le level-up en dérive le DELTA
// (2 nouvelles compétences au palier atteint) ; la création prend le total dû à son niveau.
//
// Le « pick » d'expertise n'est PAS une feature matérialisée : c'est une compétence passée à
// `proficiency_level='expert'` (character_skills). L'owner « Expertise » reste donc `class_feature`
// visible (contrairement à l'owner de sous-classe/style, invisible).
//
// Aucune dépendance runtime `hub:db` (import de type seul) → testable en unit.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Nombre CUMULATIF de compétences d'expertise par niveau (table `lookup`, index = niveau - 1,
 * cf. shared/utils/formula.ts). Roublard : 2 aux niv 1-5, 4 au niv 6+. Barde : 2 aux niv 3-9,
 * 4 au niv 10+ (0 sous le palier d'accès — la progression est de toute façon gatée par l'owner).
 */
export const EXPERTISE_COUNT_BY_CLASS: Record<string, number[]> = {
  Roublard: [2, 2, 2, 2, 2, 4],
  Barde: [0, 0, 2, 2, 2, 2, 2, 2, 2, 4],
}

/** Nom de la feature owner du point de choix d'expertise (celle qui porte la progression). */
export const EXPERTISE_OWNER_NAME = 'Expertise'

/**
 * Progression `kind:'expertise'` d'une classe (count cumulatif ci-dessus, options = compétences
 * DÉJÀ maîtrisées, résolues live). `null` si la classe n'a pas d'expertise.
 */
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
