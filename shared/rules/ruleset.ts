import { z } from 'zod'

/**
 * Édition de règles — ensemble fermé canonique (cf. decisions.md D6).
 *
 * Discriminant qui distingue les deux systèmes qui **cohabitent** dans l'app
 * (cf. D1) : la 5e « 2014 » et la 5e « 2024 » (dite 5.5). Il est **figé par
 * personnage** à la création (D2), et porté par une colonne `ruleset` sur
 * `character_sheets` ET les tables du catalogue (`character_species`, `classes`,
 * `backgrounds`, `features`, `spell_classes`) : deux entités homonymes (Elfe 5 vs
 * Elfe 5.5) coexistent alors sans matching de nom fragile.
 *
 * Cette const n'en porte que l'ensemble des valeurs légales, dont le type et le Zod
 * dérivent (même pattern que [[shared/rules/spellcasting.ts]] et
 * [[shared/rules/featureTags.ts]]). Node-safe : aucun import de valeur `~~`/`hub:db`.
 *
 * - `'5'`   — 5e « 2014 » (PHB 2014). **Toutes les données existantes** : c'est le
 *             DEFAULT de la colonne, donc le backfill des lignes déjà en base.
 * - `'5.5'` — 5e « 2024 » (PHB 2024). Contenu introduit en Phase 2.
 *
 * Millésimes = repères de lecture seulement (cf. D2) ; la valeur machine reste
 * `'5'` / `'5.5'`.
 */
export const RULESETS = ['5', '5.5'] as const

/** Union dérivée. Valeur de la colonne `ruleset`. */
export type Ruleset = (typeof RULESETS)[number]

/** Validateur Zod dérivé — à utiliser au lieu d'un `z.enum([…])` recopié. */
export const rulesetEnum = z.enum(RULESETS)
