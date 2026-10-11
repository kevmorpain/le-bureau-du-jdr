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
