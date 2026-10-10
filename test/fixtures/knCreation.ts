import type { KnCreation } from '../../shared/ker-nethalas/creation'

// Une création valide aux valeurs minimales des dés : compétences d'arme pour +60 et +40, puis 3×30, 2×20 et 3×10.
export const validKnCreation = (name: string, over: Partial<KnCreation> = {}): KnCreation => ({
  name,
  appearance: '',
  vitals: { health: 11, toughness: 23, aether: 9, sanity: 11 },
  allotments: {
    bladedWeapons: 60,
    bludgeoningWeapons: 40,
    acrobatics: 30,
    athletics: 30,
    dodge: 30,
    perception: 20,
    stealth: 20,
    scavenge: 10,
    medicine: 10,
    reason: 10,
  },
  resistanceBoost: 'endurance',
  personalGoals: '',
  kit: null,
  ...over,
})
