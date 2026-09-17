import { z } from 'zod'

// Les dons 2014 n'ont pas de catégorie (NULL) : un `optionSource:{feats}` sans `category` les propose tous.
export const FEAT_CATEGORIES = ['origin', 'general', 'fighting_style', 'epic_boon'] as const

export type FeatCategory = (typeof FEAT_CATEGORIES)[number]

export const featCategoryEnum = z.enum(FEAT_CATEGORIES)
