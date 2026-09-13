/**
 * Catégories de taille de créature — ensemble fermé canonique.
 *
 * Les codes sont ceux stockés en base par `character_species.size` (enum `CreatureSize`
 * de `server/db/schema/character_species.ts`, en anglais : T/S/M/L/H/G). Ce module ne
 * réimporte pas l'enum pour ne pas tirer Drizzle dans le bundle client : il en porte les
 * libellés français et les règles qui dépendent de la taille.
 */
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

/**
 * Tailles qui subissent le désavantage aux attaques avec une arme lourde (PHB 2014 p. 147 :
 * « Petite ou Très petite »).
 */
export const HEAVY_WEAPON_DISADVANTAGE_SIZES: readonly CreatureSizeCode[] = ['T', 'S']

export const hasHeavyWeaponDisadvantage = (size: string | null | undefined): boolean =>
  HEAVY_WEAPON_DISADVANTAGE_SIZES.includes(size as CreatureSizeCode)
