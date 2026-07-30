import type { FeatureDef, ProgressionDef } from '../lib/seedClass'
import type { Formula } from '~~/shared/utils/formula'

// ⚠️ Module de DONNÉES PURES : imports de TYPES uniquement (effacés au runtime), donc
// aucun import de valeur en `~~/…` ni de `hub:db`. C'est ce qui le rend importable par
// le projet vitest `unit` (environnement node, sans alias `~~`) — même contrat que
// data/warlock_invocations.ts (4b) et data/classes.ts (4a). Les Formula y sont écrites
// en littéraux (pas via les helpers `fixed`/`lookup`, qui sont des imports de valeur).

/**
 * Nombre d'invocations connues par niveau d'occultiste (PHB 2014). Index = niveau - 1.
 * Source unique : réutilisé à la fois pour le compteur de « Manifestations occultes »
 * (`maxUsesFormula`) et pour le `count` de la progression `invocations`.
 */
export const INVOCATIONS_KNOWN: Formula = {
  op: 'lookup',
  table: [0, 2, 2, 2, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8],
}

/**
 * Les trois faveurs de pacte de l'Occultiste, comme features-OPTIONS individuelles
 * taguées `pact_boon` (cf. shared/rules/featureTags.ts). Elles matérialisent en base ce
 * qui n'était jusqu'ici que de la prose dans la feature conteneur « Faveur de pacte » —
 * pour que la progression `pact_boon` les énumère via
 * `optionSource:{feature_group:'pact_boon'}`. `tag` non nul ⇒ ce ne sont PAS des grants
 * passifs : jamais attribuées d'office (cf. server/utils/features.ts).
 *
 * Descriptions volontairement concises et IDENTIQUES à celles de la migration 0082, pour
 * que les deux chemins (seed base neuve / migration base déployée) convergent au mot près.
 */
export const warlockPactBoonFeatures: FeatureDef[] = [
  {
    name: 'Pacte de la Chaîne',
    description: 'Vous apprenez le sort Appel de familier et pouvez le lancer en tant que rituel ; votre familier peut prendre une forme spéciale (diablotin, pseudodragon, quasit ou lutin) et attaquer avec sa réaction.',
    featureType: 'class_feature',
    levelRequired: 3,
    tag: 'pact_boon',
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Pacte de la Lame',
    description: 'Vous pouvez créer une arme de pacte magique dans votre main ; vous en avez la maîtrise, elle compte comme magique, et vous pouvez la faire apparaître ou disparaître à volonté.',
    featureType: 'class_feature',
    levelRequired: 3,
    tag: 'pact_boon',
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Pacte du Tome',
    description: 'Votre patron vous offre le Livre des Ombres : choisissez trois sorts mineurs dans la liste de n\'importe quelle classe, que vous pouvez lancer à volonté tant que vous détenez le livre.',
    featureType: 'class_feature',
    levelRequired: 3,
    tag: 'pact_boon',
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
]

/**
 * Les points de choix (`progression`) de l'Occultiste, chacun rattaché à sa feature
 * PROPRIÉTAIRE par (nom + niveau requis) — owner = featureId (D4). Le seed (via
 * seedClass._syncProgression) et la migration 0082 doivent produire exactement ces
 * lignes ; le contrat est vérifié dans test/unit/warlockProgression.test.ts contre
 * test/fixtures/warlockProgression.ts.
 *
 * Trois `kind` :
 *  - `pact_boon`   : 1 choix parmi le groupe `pact_boon` (les 3 features ci-dessus) ;
 *  - `invocations` : N (table par niveau) parmi le groupe `invocation`, échangeables ;
 *  - `spell`       : 1 sort d'occultiste d'un niveau donné (les 4 arcanums mystiques).
 */
export interface WarlockProgressionOwner {
  ownerName: string
  ownerLevelRequired: number
  progression: ProgressionDef
}

export const warlockProgressionByOwner: WarlockProgressionOwner[] = [
  {
    ownerName: 'Faveur de pacte',
    ownerLevelRequired: 3,
    progression: {
      kind: 'pact_boon',
      count: { op: 'fixed', value: 1 },
      optionSource: { type: 'feature_group', group: 'pact_boon' },
      replaceable: false,
    },
  },
  {
    ownerName: 'Manifestations occultes',
    ownerLevelRequired: 2,
    progression: {
      kind: 'invocations',
      count: INVOCATIONS_KNOWN,
      optionSource: { type: 'feature_group', group: 'invocation' },
      replaceable: true,
    },
  },
  {
    ownerName: 'Arcanum mystique (niveau 6)',
    ownerLevelRequired: 11,
    progression: {
      kind: 'spell',
      count: { op: 'fixed', value: 1 },
      optionSource: { type: 'spells', spellClass: 'warlock', maxLevel: 6 },
      replaceable: false,
    },
  },
  {
    ownerName: 'Arcanum mystique (niveau 7)',
    ownerLevelRequired: 13,
    progression: {
      kind: 'spell',
      count: { op: 'fixed', value: 1 },
      optionSource: { type: 'spells', spellClass: 'warlock', maxLevel: 7 },
      replaceable: false,
    },
  },
  {
    ownerName: 'Arcanum mystique (niveau 8)',
    ownerLevelRequired: 15,
    progression: {
      kind: 'spell',
      count: { op: 'fixed', value: 1 },
      optionSource: { type: 'spells', spellClass: 'warlock', maxLevel: 8 },
      replaceable: false,
    },
  },
  {
    ownerName: 'Arcanum mystique (niveau 9)',
    ownerLevelRequired: 17,
    progression: {
      kind: 'spell',
      count: { op: 'fixed', value: 1 },
      optionSource: { type: 'spells', spellClass: 'warlock', maxLevel: 9 },
      replaceable: false,
    },
  },
]
