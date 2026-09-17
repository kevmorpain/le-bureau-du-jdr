import { z } from 'zod'

// `items.rarity` null = objet non magique.
export const RARITIES = ['common', 'uncommon', 'rare', 'very_rare', 'legendary', 'artifact'] as const

export type Rarity = (typeof RARITIES)[number]

export const rarityEnum = z.enum(RARITIES)

export const RARITY_LABELS_FR: Record<Rarity, string> = {
  common: 'Commun',
  uncommon: 'Peu commun',
  rare: 'Rare',
  very_rare: 'Très rare',
  legendary: 'Légendaire',
  artifact: 'Artéfact',
}
