import type { Effect } from '~~/server/db/schema/effects'
import { ABILITY_KEYS, type AbilityKey } from '~~/shared/rules/abilities'

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

// `capped` : points de `bonus` perdus au plafond ; `items` : apport des effets actifs (objets, effets
// temporaires) au-delà du score naturel.
export interface AbilityScoreBreakdown {
  base: number
  species: number
  feature: number
  asi: number
  bonus: number
  maximum: number
  capped: number
  items: number
  total: number
}

export interface AbilityScoreSources {
  base: Partial<Record<string, number>>
  speciesEffects: Effect[]
  featureEffects: Effect[]
  asiEffects: Effect[]
  // Effets des objets actifs et des effets temporaires.
  activeEffects: Effect[]
}

const sumAbilityIncreases = (effects: readonly Effect[]): Partial<Record<AbilityKey, number>> => {
  const out: Partial<Record<AbilityKey, number>> = {}
  for (const e of effects) {
    if (e.type === 'ability_increase') out[e.value.ability] = (out[e.value.ability] ?? 0) + e.value.amount
  }
  return out
}

export function computeAbilityScores(sources: AbilityScoreSources): Record<AbilityKey, AbilityScoreBreakdown> {
  const species = sumAbilityIncreases(sources.speciesEffects)
  const feature = sumAbilityIncreases(sources.featureEffects)
  const asi = sumAbilityIncreases(sources.asiEffects)

  const maxIncreases: Partial<Record<AbilityKey, number>> = {}
  for (const e of [...sources.speciesEffects, ...sources.featureEffects, ...sources.asiEffects, ...sources.activeEffects]) {
    if (e.type === 'ability_max_increase') maxIncreases[e.value.ability] = (maxIncreases[e.value.ability] ?? 0) + e.value.amount
  }

  const active: Partial<Record<AbilityKey, { increases: { amount: number, max?: number }[], sets: number[] }>> = {}
  for (const e of sources.activeEffects) {
    if (e.type !== 'ability_increase' && e.type !== 'ability_score_set') continue
    const entry = (active[e.value.ability] ??= { increases: [], sets: [] })
    if (e.type === 'ability_score_set') entry.sets.push(e.value.score)
    // Champ « Maximum » vidé dans l'éditeur d'objet → '' : retombe sur le maximum du personnage.
    else entry.increases.push({ amount: e.value.amount, max: typeof e.value.max === 'number' ? e.value.max : undefined })
  }

  return Object.fromEntries(ABILITY_KEYS.map((ability) => {
    const base = sources.base[ability] || 10
    const bonuses = { species: species[ability] ?? 0, feature: feature[ability] ?? 0, asi: asi[ability] ?? 0 }
    const bonus = bonuses.species + bonuses.feature + bonuses.asi
    const { maximum, natural, total } = resolveAbilityScore({
      base,
      naturalBonus: bonus,
      maxIncrease: maxIncreases[ability] ?? 0,
      itemIncreases: active[ability]?.increases ?? [],
      itemSets: active[ability]?.sets ?? [],
    })
    return [ability, { base, ...bonuses, bonus, maximum, capped: base + bonus - natural, items: total - natural, total }]
  })) as Record<AbilityKey, AbilityScoreBreakdown>
}
