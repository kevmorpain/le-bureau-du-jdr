import type { RollSource } from './rolls'

export interface RangeChoice {
  long: boolean
  adjacent: boolean
}

export const NO_RANGE_CHOICE: RangeChoice = { long: false, adjacent: false }

// L'application ne connaît pas la cible : la distance et l'ennemi au contact sont des choix du joueur.
export const rangeRollSources = (choice: RangeChoice): RollSource[] => [
  ...(choice.long ? [{ label: 'Longue portée', mode: 'disadvantage' as const }] : []),
  ...(choice.adjacent ? [{ label: 'Ennemi à 1,50 m', mode: 'disadvantage' as const }] : []),
]
