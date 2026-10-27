import type { KnDamageType } from './damageTypes'

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

export const KN_OVERSEER_INFLUENCE_DIE = KN_OVERSEER_INFLUENCE_KEYS.length

export interface KnOverseerInfluenceEntry {
  key: KnOverseerInfluenceKey
  damageType?: KnDamageType
}

// Le n-ième « Résistant » reçoit le n-ième type tiré ; un « Résistant » sans type attend son jet. La liste de types est absente
// des Domaines enregistrés avant elle : elle vaut vide.
export function knOverseerInfluenceEntries(keys: readonly KnOverseerInfluenceKey[], resistances: readonly KnDamageType[] = []): KnOverseerInfluenceEntry[] {
  let resistant = 0
  return keys.map((key) => {
    if (key !== 'resistant') return { key }
    const damageType = resistances[resistant++]
    return damageType ? { key, damageType } : { key }
  })
}

export const knPendingResistances = (keys: readonly KnOverseerInfluenceKey[], resistances: readonly KnDamageType[] = []): number =>
  Math.max(0, keys.filter(key => key === 'resistant').length - resistances.length)

// Retire l'influence à cet index ; un « Résistant » emporte le type de dégâts qui lui était apparié.
export function knRemoveInfluence(keys: readonly KnOverseerInfluenceKey[], index: number, resistances: readonly KnDamageType[] = []) {
  const paired = keys[index] === 'resistant' ? keys.slice(0, index).filter(key => key === 'resistant').length : -1
  return {
    keys: keys.filter((_, at) => at !== index),
    resistances: resistances.filter((_, at) => at !== paired),
  }
}
