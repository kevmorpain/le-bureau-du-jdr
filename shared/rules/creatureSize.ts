// Codes de l'enum `CreatureSize` du schéma, non réimporté pour ne pas tirer Drizzle dans le bundle client.
export const CREATURE_SIZE_LABELS = {
  T: 'Très petite',
  S: 'Petite',
  M: 'Moyenne',
  L: 'Grande',
  H: 'Très grande',
  G: 'Gigantesque',
} as const

export type CreatureSizeCode = keyof typeof CREATURE_SIZE_LABELS

export const creatureSizeLabel = (size: string | null | undefined): string | null =>
  CREATURE_SIZE_LABELS[size as CreatureSizeCode] ?? null

// PHB 2014 p. 147
export const HEAVY_WEAPON_DISADVANTAGE_SIZES: readonly CreatureSizeCode[] = ['T', 'S']

export const hasHeavyWeaponDisadvantage = (size: string | null | undefined): boolean =>
  HEAVY_WEAPON_DISADVANTAGE_SIZES.includes(size as CreatureSizeCode)
