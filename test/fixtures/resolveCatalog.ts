import { WARLOCK_PROGRESSION_CONTRACT } from './warlockProgression'
import type { Catalog, CatalogProgression, ResolvedOption } from '../../shared/rules/resolve'

/**
 * Fixture de CATALOGUE pour les tests de `resolveChoices` (cf. decisions.md D12 : des valeurs
 * D&D vérifiées à la main). Le cas de vérité est l'Occultiste seedé au lot 4c : on réutilise
 * directement WARLOCK_PROGRESSION_CONTRACT (la table de référence UNIQUE que seed + migration
 * respectent déjà) et on lui attache les ensembles d'options qu'un loader (lot 5b) résoudra en
 * base — ici synthétiques mais de bonne CARDINALITÉ (3 pactes, 41 invocations), pour que la
 * résolution des `count` et des `options` soit vérifiable sans DB.
 *
 * Ids synthétiques : `progressionId` = index + 1 dans le contrat ; les features/sorts options
 * portent des ids arbitraires distincts. Seule compte leur cohérence interne.
 */

/** Classe propriétaire des points de choix de l'Occultiste dans la fixture. */
export const WARLOCK_CLASS_ID = 1

/** Les 3 faveurs de pacte (`optionSource:{feature_group:'pact_boon'}`). */
export const PACT_BOON_OPTIONS: ResolvedOption[] = [
  { featureId: 11 },
  { featureId: 12 },
  { featureId: 13 },
]

/** Les 41 manifestations occultes (`optionSource:{feature_group:'invocation'}`). */
export const INVOCATION_OPTIONS: ResolvedOption[] = Array.from({ length: 41 }, (_, i) => ({ featureId: 100 + i }))

/** Quelques sorts d'occultiste par niveau max, pour les arcanums (`optionSource:{spells}`). */
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

/** Catalogue de l'Occultiste : les 6 points de choix du contrat, options attachées. */
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
 * Catalogue minimal d'un point de choix `proficient_skills` (Expertise du Roublard L1 :
 * 2 picks parmi les compétences DÉJÀ maîtrisées). Volontairement SANS `options` : la
 * résolution doit les produire live depuis `projection.proficientSkills` (rules-engine.md §5).
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
