import type { FeatureTag } from '../../shared/rules/featureTags'
import type { FeatureType } from '../../server/db/schema/features'

/**
 * Contrat des groupes de features-options : valeurs vérifiées à la main. La const canonique, la
 * migration 0081 et le seed doivent s'y conformer. `featureType: null` + `seeded: false` = groupe
 * dont la valeur du tag est figée, mais que rien ne porte encore en base.
 */
export interface FeatureTagContract {
  tag: FeatureTag
  featureType: FeatureType | null
  seeded: boolean
}

export const FEATURE_TAG_CONTRACT: FeatureTagContract[] = [
  { tag: 'invocation', featureType: 'eldritch_invocation', seeded: true },
  { tag: 'metamagic', featureType: null, seeded: false },
  { tag: 'maneuver', featureType: null, seeded: false },
  { tag: 'fighting_style', featureType: null, seeded: false },
  { tag: 'pact_boon', featureType: null, seeded: false },
]
