import type { FeatureDef, ProgressionDef } from '../lib/seedClass'
import type { Formula } from '~~/shared/utils/formula'

/** Nombre d'options de Métamagie connues par niveau d'ensorceleur (PHB 2014). Index = niveau - 1. */
export const METAMAGIC_KNOWN: Formula = {
  op: 'lookup',
  table: [0, 0, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4],
}

export const ensorceleurMetamagicFeatures: FeatureDef[] = [
  {
    name: 'Sort accéléré',
    description: 'Quand vous lancez un sort dont le temps d\'incantation est de 1 action, vous pouvez le lancer en 1 action bonus à la place. Coût : 2 points de sorcellerie.',
    featureType: 'class_feature',
    levelRequired: 3,
    tag: 'metamagic',
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Sort ample',
    description: 'Quand vous lancez un sort dont la portée est d\'au moins 1,50 m, vous pouvez doubler cette portée. Si la portée est « contact », elle passe à 9 m. Coût : 1 point de sorcellerie.',
    featureType: 'class_feature',
    levelRequired: 3,
    tag: 'metamagic',
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Sort étendu',
    description: 'Quand vous lancez un sort d\'une durée d\'au moins 1 minute, vous pouvez doubler sa durée (jusqu\'à un maximum de 24 heures). Coût : 1 point de sorcellerie.',
    featureType: 'class_feature',
    levelRequired: 3,
    tag: 'metamagic',
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Sort intensifié',
    description: 'Quand vous lancez un sort qui impose un jet de sauvegarde, une cible de votre choix a le désavantage à son premier jet de sauvegarde contre ce sort. Coût : 3 points de sorcellerie.',
    featureType: 'class_feature',
    levelRequired: 3,
    tag: 'metamagic',
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Sort jumeau',
    description: 'Quand vous lancez un sort ciblant une seule créature et sans zone d\'effet, vous pouvez viser une seconde créature à portée avec le même sort. Coût : nombre de points égal au niveau du sort (1 pour un sort mineur).',
    featureType: 'class_feature',
    levelRequired: 3,
    tag: 'metamagic',
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Sort prévenant',
    description: 'Quand vous lancez un sort qui impose un jet de sauvegarde, vous protégez un nombre de créatures de votre choix égal à votre modificateur de Charisme (minimum 1) : elles réussissent automatiquement leur sauvegarde contre ce sort. Coût : 1 point de sorcellerie.',
    featureType: 'class_feature',
    levelRequired: 3,
    tag: 'metamagic',
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Sort renforcé',
    description: 'Quand vous lancez un sort infligeant des dégâts, vous pouvez relancer un nombre de dés de dégâts égal à votre modificateur de Charisme (minimum 1) et devez garder les nouveaux résultats. Utilisable même si vous avez déjà employé une autre option de Métamagie sur ce sort. Coût : 1 point de sorcellerie.',
    featureType: 'class_feature',
    levelRequired: 3,
    tag: 'metamagic',
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
  {
    name: 'Sort subtil',
    description: 'Quand vous lancez un sort, vous pouvez le lancer sans composante verbale ni somatique. Coût : 1 point de sorcellerie.',
    featureType: 'class_feature',
    levelRequired: 3,
    tag: 'metamagic',
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [],
  },
]

/** ⚠️ NON échangeable : la Métamagie 2014 n'offre aucun remplacement d'option à la montée de niveau. */
export interface EnsorceleurProgressionOwner {
  ownerName: string
  ownerLevelRequired: number
  progression: ProgressionDef
}

export const ensorceleurProgressionByOwner: EnsorceleurProgressionOwner[] = [
  {
    ownerName: 'Métamagie',
    ownerLevelRequired: 3,
    progression: {
      kind: 'metamagic',
      count: METAMAGIC_KNOWN,
      optionSource: { type: 'feature_group', group: 'metamagic' },
      replaceable: false,
    },
  },
]
