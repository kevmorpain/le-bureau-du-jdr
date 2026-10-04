import { rollEngineKey } from './character/useCharacterRolls'

// Hors d'une fiche (aucun moteur fourni), il n'y a pas de préférence à lire : les jets restent actifs.
export const useRollsEnabled = (): ComputedRef<boolean> =>
  inject(rollEngineKey, null)?.rollsEnabled ?? computed(() => true)
