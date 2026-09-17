import { WARLOCK_PROGRESSION_CONTRACT } from './warlockProgression'
import type { Catalog, CatalogProgression, ResolvedOption } from '../../shared/rules/resolve'

/**
 * Fixture de catalogue pour `resolveChoices` : le contrat de l'Occultiste, augmenté d'ensembles
 * d'options synthétiques mais de bonne CARDINALITÉ (3 pactes, 41 invocations). Ids synthétiques :
 * seule compte leur cohérence interne.
 */

export const WARLOCK_CLASS_ID = 1

export const PACT_BOON_OPTIONS: ResolvedOption[] = [
  { featureId: 11 },
  { featureId: 12 },
  { featureId: 13 },
]

export const INVOCATION_OPTIONS: ResolvedOption[] = Array.from({ length: 41 }, (_, i) => ({ featureId: 100 + i }))

export const ARCANUM_SPELL_OPTIONS: ResolvedOption[] = [
  { spellId: 601 },
  { spellId: 602 },
  { spellId: 603 },
]

function optionsFor(optionSource: CatalogProgression['optionSource']): ResolvedOption[] {
  if (optionSource.type === 'feature_group') {
    if (optionSource.group === 'pact_boon') return PACT_BOON_OPTIONS
    if (optionSource.group === 'invocation') return INVOCATION_OPTIONS
  }
  if (optionSource.type === 'spells') return ARCANUM_SPELL_OPTIONS
  return []
}

export function warlockCatalog(): Catalog {
  return {
    progressions: WARLOCK_PROGRESSION_CONTRACT.map((c, i): CatalogProgression => ({
      progressionId: i + 1,
      ownerFeatureId: 1000 + i,
      ownerClassId: WARLOCK_CLASS_ID,
      ownerLevelRequired: c.ownerLevelRequired,
      kind: c.kind,
      count: c.count,
      optionSource: c.optionSource,
      replaceable: c.replaceable,
      options: optionsFor(c.optionSource),
    })),
  }
}

/**
 * Expertise du Roublard : 2 picks parmi les compétences DÉJÀ maîtrisées. Volontairement SANS
 * `options` — la résolution doit les produire live depuis `projection.proficientSkills`.
 */
export const EXPERTISE_CLASS_ID = 7

export function expertiseCatalog(): Catalog {
  return {
    progressions: [
      {
        progressionId: 1,
        ownerClassId: EXPERTISE_CLASS_ID,
        ownerLevelRequired: 1,
        kind: 'expertise',
        count: { op: 'fixed', value: 2 },
        optionSource: { type: 'proficient_skills' },
        replaceable: false,
        // pas d'`options` : résolues live contre l'état du perso
      },
    ],
  }
}
