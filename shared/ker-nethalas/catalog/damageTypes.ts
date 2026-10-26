export const KN_DAMAGE_TYPES = [
  'acid',
  'arcane',
  'bludgeoning',
  'cold',
  'fire',
  'force',
  'holy',
  'infernal',
  'lightning',
  'necrotic',
  'piercing',
  'poison',
  'psychic',
  'slashing',
] as const

export type KnDamageType = (typeof KN_DAMAGE_TYPES)[number]

export const KN_DAMAGE_TYPE_DIE = 20

// D20 des types de dégâts, dans l'ordre du livre : chaque entrée donne la dernière face du type.
const DAMAGE_TYPE_BANDS: readonly [number, KnDamageType][] = [
  [1, 'acid'], [3, 'arcane'], [5, 'bludgeoning'], [6, 'cold'], [8, 'force'], [9, 'fire'], [10, 'holy'],
  [11, 'infernal'], [12, 'lightning'], [14, 'necrotic'], [16, 'piercing'], [17, 'poison'], [18, 'psychic'], [20, 'slashing'],
]

export const knDamageTypeAt = (roll: number): KnDamageType => DAMAGE_TYPE_BANDS.find(([last]) => roll <= last)![1]

// Combien de points d'Armure un type de dégâts ignore : tous, ou un nombre.
export const KN_ARMOR_IGNORED: Record<KnDamageType, number | 'all'> = {
  acid: 0,
  arcane: 'all',
  bludgeoning: 1,
  cold: 'all',
  fire: 'all',
  force: 'all',
  holy: 'all',
  infernal: 'all',
  lightning: 'all',
  necrotic: 'all',
  piercing: 0,
  poison: 'all',
  psychic: 'all',
  slashing: 0,
}
