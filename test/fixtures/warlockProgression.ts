import type { Formula } from '../../shared/utils/formula'
import type { ChoiceKind, OptionSource } from '../../shared/rules/choices'
import type { FeatureTag } from '../../shared/rules/featureTags'
import type { FeatureType } from '../../server/db/schema/features'

/**
 * Contrat du CATALOGUE de choix de l'Occultiste (cf. decisions.md D12 : des valeurs D&D
 * vérifiées à la main, pas un snapshot). Table de référence UNIQUE que trois angles
 * doivent respecter — comme test/fixtures/classIdentity.ts (4a) et featureTags.ts (4b) :
 *   1. le seed des bases neuves — data/warlock_progression.ts (warlockProgressionByOwner,
 *      warlockPactBoonFeatures, INVOCATIONS_KNOWN) ;
 *   2. la migration 0082 rejouée sur une base peuplée (backfill des bases déployées) ;
 *   3. la RÉSOLUTION d'un optionSource:{feature_group} → un ensemble d'options non vide.
 *
 * Source : PHB FR 2014 (occultiste) — pacte au niveau 3, manifestations au niveau 2 (table
 * d'invocations connues), arcanums mystiques aux niveaux 11/13/15/17 (sorts de niveau 6/7/8/9).
 */
const INVOCATIONS_COUNT: Formula = {
  op: 'lookup',
  table: [0, 2, 2, 2, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8],
}

export interface WarlockProgressionContract {
  ownerName: string
  ownerLevelRequired: number
  kind: ChoiceKind
  count: Formula
  optionSource: OptionSource
  replaceable: boolean
}

export const WARLOCK_PROGRESSION_CONTRACT: WarlockProgressionContract[] = [
  { ownerName: 'Faveur de pacte', ownerLevelRequired: 3, kind: 'pact_boon', count: { op: 'fixed', value: 1 }, optionSource: { type: 'feature_group', group: 'pact_boon' }, replaceable: false },
  { ownerName: 'Manifestations occultes', ownerLevelRequired: 2, kind: 'invocations', count: INVOCATIONS_COUNT, optionSource: { type: 'feature_group', group: 'invocation' }, replaceable: true },
  { ownerName: 'Arcanum mystique (niveau 6)', ownerLevelRequired: 11, kind: 'spell', count: { op: 'fixed', value: 1 }, optionSource: { type: 'spells', spellClass: 'warlock', maxLevel: 6 }, replaceable: false },
  { ownerName: 'Arcanum mystique (niveau 7)', ownerLevelRequired: 13, kind: 'spell', count: { op: 'fixed', value: 1 }, optionSource: { type: 'spells', spellClass: 'warlock', maxLevel: 7 }, replaceable: false },
  { ownerName: 'Arcanum mystique (niveau 8)', ownerLevelRequired: 15, kind: 'spell', count: { op: 'fixed', value: 1 }, optionSource: { type: 'spells', spellClass: 'warlock', maxLevel: 8 }, replaceable: false },
  { ownerName: 'Arcanum mystique (niveau 9)', ownerLevelRequired: 17, kind: 'spell', count: { op: 'fixed', value: 1 }, optionSource: { type: 'spells', spellClass: 'warlock', maxLevel: 9 }, replaceable: false },
]

export interface PactBoonOptionContract {
  name: string
  levelRequired: number
  tag: FeatureTag
  featureType: FeatureType
}

export const WARLOCK_PACT_BOON_OPTIONS: PactBoonOptionContract[] = [
  { name: 'Pacte de la Chaîne', levelRequired: 3, tag: 'pact_boon', featureType: 'class_feature' },
  { name: 'Pacte de la Lame', levelRequired: 3, tag: 'pact_boon', featureType: 'class_feature' },
  { name: 'Pacte du Tome', levelRequired: 3, tag: 'pact_boon', featureType: 'class_feature' },
]

/**
 * Résolution attendue d'un `optionSource:{feature_group}` : le nombre de features taguées
 * pour chaque groupe qu'une progression de l'Occultiste énumère. Le cœur du lot : un point
 * de choix doit pointer un ensemble d'options RÉEL et non vide.
 */
export const FEATURE_GROUP_RESOLUTION: Record<string, number> = {
  pact_boon: 3, // les 3 WARLOCK_PACT_BOON_OPTIONS
  invocation: 41, // les 41 manifestations occultes (data/warlock_invocations.ts)
}
