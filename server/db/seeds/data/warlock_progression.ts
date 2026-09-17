import type { FeatureDef, ProgressionDef } from '../lib/seedClass'
import type { Formula } from '~~/shared/utils/formula'

/** Nombre d'invocations connues par niveau d'occultiste (PHB 2014). Index = niveau - 1. */
export const INVOCATIONS_KNOWN: Formula = {
  op: 'lookup',
  table: [0, 2, 2, 2, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8],
}

// Faveurs de pacte comme features-OPTIONS taguées `pact_boon` : jamais attribuées d'office.
// Descriptions identiques à celles de la migration 0082, pour que seed et migration convergent.
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

/** Chaque point de choix est rattaché à sa feature PROPRIÉTAIRE par (nom + niveau) — owner = featureId (D4). */
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
