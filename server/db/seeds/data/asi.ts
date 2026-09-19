import type { FeatureDef, ProgressionDef } from '../lib/seedClass'
import { ABILITY_KEYS } from '~~/shared/rules/abilities'

// Paliers d'ASI par classe (PHB 2014) : défaut [4,8,12,16,19] ; seuls Guerrier et Roublard en gagnent plus.
const DEFAULT_ASI_LEVELS = [4, 8, 12, 16, 19]
export const ASI_LEVELS_BY_CLASS: Record<string, number[]> = {
  Guerrier: [4, 6, 8, 12, 14, 16, 19],
  Roublard: [4, 8, 10, 12, 16, 19],
}
export function asiLevels(className: string): number[] {
  return ASI_LEVELS_BY_CLASS[className] ?? DEFAULT_ASI_LEVELS
}

export const ASI_FEATURE_NAME = 'Amélioration de caractéristiques'

// Le choix d'ASI est COMPOSITE (augmenter une carac. OU prendre un don) : le front rend les deux
// branches. L'optionSource `abilities` décrit la branche carac. (2+1 ou 1+1+1) ; le catalogue ne
// la consomme pas (résolue front). Un palier = un choix (count 1) au niveau de la feature.
const asiProgression: ProgressionDef = {
  kind: 'asi_or_feat',
  count: { op: 'fixed', value: 1 },
  optionSource: { type: 'abilities', from: [...ABILITY_KEYS], distributions: ['2+1', '1+1+1'] },
  replaceable: false,
}

// Une feature « Amélioration de caractéristiques » par palier d'ASI de la classe, chacune porteuse
// de la progression asi_or_feat à son niveau — source unique des niveaux d'ASI (builder, level-up, fiche).
export function asiFeatures(className: string): FeatureDef[] {
  return asiLevels(className).map(level => ({
    name: ASI_FEATURE_NAME,
    description: `Au niveau ${level}, vous pouvez augmenter la valeur de votre choix de caractéristique de 2, ou augmenter deux valeurs de caractéristique de votre choix de 1. Vous ne pouvez pas augmenter une valeur de caractéristique au-delà de 20 en utilisant cette aptitude.`,
    featureType: 'class_feature',
    levelRequired: level,
    actionType: null,
    rechargeType: null,
    maxUsesFormula: null,
    effects: [{ type: 'asi_or_feat', value: {} }],
    progression: asiProgression,
  }))
}
