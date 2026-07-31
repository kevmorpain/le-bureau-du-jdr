import type { MasteryProperty } from '../../shared/rules/masteryProperties'

/**
 * Contrat des **propriétés de maîtrise d'armes** 2024 (cf. decisions.md D12 : des
 * valeurs D&D vérifiées à la main, pas un snapshot). Table de référence UNIQUE que la
 * const `shared/rules/masteryProperties.ts` doit respecter (ensemble + ordre), et dont
 * la colonne `items.mastery_property` (migration 0083) dérive.
 *
 * `label` = le libellé français canonique d'AideDD (règles 2024,
 * https://www.aidedd.org/regles-24/equipement/armes/), mappé sur la clé machine EN par
 * l'effet de chaque propriété. Non consommé en base à ce stade (les labels vivent dans
 * l'i18n, D11 ; le contenu 5.5 est Phase 2) — il fige l'intention pour la suite et
 * documente le choix de clés EN.
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
