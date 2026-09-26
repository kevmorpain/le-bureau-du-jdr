// PHB 2014 : « Les aventuriers peuvent avoir des valeurs qui montent jusqu'à 20 ». Les ASI et les
// demi-dons plafonnent à cette valeur ; Champion primitif ou un manuel la relèvent.
export const ABILITY_SCORE_MAX = 20

export interface AbilityScoreInput {
  base: number
  // Espèce + capacités + ASI + dons : bornés par le maximum du personnage.
  naturalBonus: number
  maxIncrease: number
  itemIncreases: { amount: number, max?: number }[]
  itemSets: number[]
}

export interface ResolvedAbilityScore {
  maximum: number
  natural: number
  total: number
}

// Un plafond borne ce qu'une source AJOUTE, jamais le score déjà acquis : une base saisie au-delà
// (fiche ajustée à la main) ou un score naturel au-dessus du plafond d'un objet reste tel quel.
const addCapped = (score: number, amount: number, cap: number): number =>
  Math.min(score + amount, Math.max(cap, score))

export function resolveAbilityScore(input: AbilityScoreInput): ResolvedAbilityScore {
  const maximum = ABILITY_SCORE_MAX + input.maxIncrease
  const natural = addCapped(input.base, input.naturalBonus, maximum)
  let total = natural
  for (const { amount, max } of input.itemIncreases) total = addCapped(total, amount, max ?? maximum)
  // Gantelets de puissance d'ogre : « aucun effet sur vous si votre Force est de 19 ou plus sans eux ».
  // Appliqué après les bonus d'objets : le score « sans eux » inclut les autres objets portés.
  for (const score of input.itemSets) total = Math.max(total, score)
  return { maximum, natural, total }
}
