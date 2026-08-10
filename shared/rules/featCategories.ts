import { z } from 'zod'

/**
 * Catégories de dons 2024 — ensemble fermé canonique (cf. decisions.md D6, dnd-5.5.md §2).
 *
 * En 2024 les dons sont CATÉGORISÉS, ce qui pilote quel point de choix peut les proposer :
 * un historique grante un don d'**origine** ; un palier d'ASI ouvre un don **général** ; etc.
 * C'est un **fait d'identité** du don, porté par la colonne `features.feat_category` (« identité
 * → colonne », rules-engine.md §3) — distincte de `features.tag` (appartenance à un groupe
 * d'options). Cette const n'en porte que l'ensemble des valeurs légales, dont le type et le Zod
 * dérivent. Même patron que [[shared/rules/featureTags.ts]] / [[shared/rules/ruleset.ts]].
 * Node-safe : import `zod` seul.
 *
 * - `origin`         — don d'origine (accordé par l'historique dès le niveau 1)
 * - `general`        — don général (à la place d'un ASI)
 * - `fighting_style` — style de combat (devenu un don en 2024)
 * - `epic_boon`      — faveur épique (niveau 19)
 *
 * Les dons 2014 n'ont pas de catégorie (`feat_category` NULL) : un `optionSource:{feats}` sans
 * `category` les propose tous, donc l'absence de catégorie reste iso-2014.
 */
export const FEAT_CATEGORIES = ['origin', 'general', 'fighting_style', 'epic_boon'] as const

/** Union dérivée. Valeur (nullable) de la colonne `features.feat_category`. */
export type FeatCategory = (typeof FEAT_CATEGORIES)[number]

/** Validateur Zod dérivé — à utiliser au lieu d'un `z.enum([…])` recopié. */
export const featCategoryEnum = z.enum(FEAT_CATEGORIES)
