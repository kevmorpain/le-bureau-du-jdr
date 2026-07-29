import type { FeatureTag } from '../../shared/rules/featureTags'
import type { FeatureType } from '../../server/db/schema/features'

/**
 * Contrat des **groupes de features-options** (cf. decisions.md D12 : des valeurs
 * D&D vérifiées à la main, pas un snapshot). Table de référence UNIQUE que trois
 * angles doivent respecter (cf. test/fixtures/classIdentity.ts du lot 4a) :
 *   1. la const canonique `shared/rules/featureTags.ts` (ensemble + ordre) ;
 *   2. la migration `0081_features_tag` (backfill des bases déployées) ;
 *   3. le seed `server/db/seeds/data/warlock_invocations.ts` (bases neuves).
 *
 * `featureType` = le discriminant qui, dans la base seedée d'AUJOURD'HUI, identifie
 * les features-options du groupe. Seul `invocation` a des features-options
 * individuelles à ce stade (`eldritch_invocation`) ; les 4 autres groupes ne sont
 * encore que des features conteneurs en prose et n'auront de features-options —
 * donc de tag — qu'au lot 4c (progression). D'où `featureType: null` + `seeded:
 * false` pour eux : la valeur du tag est figée dès maintenant (référencée par le
 * schéma et, plus tard, par OptionSource), mais rien ne le porte encore en base.
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
