// Table D10, tirée une fois par Domaine. Elle modifie les créatures du Domaine,
// pas le survivant : le moteur ne produit donc que des rappels.
export const KN_OVERSEER_INFLUENCE_KEYS = [
  'tough',
  'vital',
  'frenzied',
  'skilled',
  'magebane',
  'resistant',
  'corrupting',
  'unstable',
  'alert',
  'piercing',
] as const

export type KnOverseerInfluenceKey = (typeof KN_OVERSEER_INFLUENCE_KEYS)[number]
