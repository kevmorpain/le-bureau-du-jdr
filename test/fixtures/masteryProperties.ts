import type { MasteryProperty } from '../../shared/rules/masteryProperties'

/**
 * Contrat des propriétés de maîtrise d'armes 2024 : valeurs vérifiées à la main (ensemble + ordre).
 * `label` = libellé FR canonique d'AideDD, mappé sur la clé machine EN par l'effet de la propriété.
 */
export interface MasteryPropertyContract {
  key: MasteryProperty
  label: string
}

export const MASTERY_PROPERTY_CONTRACT: MasteryPropertyContract[] = [
  { key: 'cleave', label: 'Enchaînement' },
  { key: 'graze', label: 'Écorchure' },
  { key: 'nick', label: 'Coup double' },
  { key: 'push', label: 'Poussée' },
  { key: 'sap', label: 'Sape' },
  { key: 'slow', label: 'Ralentissement' },
  { key: 'topple', label: 'Renversement' },
  { key: 'vex', label: 'Ouverture' },
]
