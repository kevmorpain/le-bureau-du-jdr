import { z } from 'zod'

/**
 * Rareté d'un objet magique — ensemble fermé canonique (D&D 5e 2014). Porté par la colonne
 * nullable `items.rarity` : **`null` = objet non magique** (équipement/arme/armure ordinaire),
 * une valeur = objet magique. C'est le signal « cet objet est magique », en tandem avec
 * `items.requires_attunement` (harmonisation) — cf. server/db/schema/items.ts.
 *
 * Même pattern que [[shared/rules/ruleset.ts]] / [[shared/rules/source.ts]] : la const porte les
 * valeurs légales, le type et le Zod en dérivent. Le map FR sert aux badges (calqué sur
 * [[shared/rules/masteryProperties.ts]]). Node-safe : aucun import de valeur `~~`/`hub:db`.
 */
export const RARITIES = ['common', 'uncommon', 'rare', 'very_rare', 'legendary', 'artifact'] as const

/** Union dérivée. Valeur de la colonne `items.rarity` (nullable → `Rarity | null`). */
export type Rarity = (typeof RARITIES)[number]

/** Validateur Zod dérivé — à utiliser au lieu d'un `z.enum([…])` recopié. */
export const rarityEnum = z.enum(RARITIES)

/** Libellés FR pour l'affichage (badges de rareté). */
export const RARITY_LABELS_FR: Record<Rarity, string> = {
  common: 'Commun',
  uncommon: 'Peu commun',
  rare: 'Rare',
  very_rare: 'Très rare',
  legendary: 'Légendaire',
  artifact: 'Artéfact',
}
