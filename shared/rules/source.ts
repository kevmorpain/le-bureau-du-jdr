import { z } from 'zod'

/**
 * Provenance d'une entrée de catalogue — discriminant de **VISIBILITÉ** (gating),
 * orthogonal à `ruleset` ([[shared/rules/ruleset.ts]], qui distingue l'ÉDITION 2014/2024).
 *
 * Motivation : la base est de facto « PHB complet » (source AideDD), donc « cacher le
 * non-SRD » cacherait la moitié de l'app. L'axe utile n'est donc PAS « SRD vs non-SRD »
 * mais « socle toujours visible » vs « contenu d'extension gaté par défaut, débloqué au
 * cas par cas » (ex. un one-shot avec du contenu Tasha).
 *
 * - `'core'` — socle toujours visible. **DEFAULT de la colonne** → backfill de TOUT
 *   l'existant. ⚠️ Conséquence assumée : quelques entrées non-SRD déjà en base avant ce
 *   discriminant (Magie sauvage, Piqûre mentale, Ennemis à foison…) restent `'core'` ;
 *   le gating cible le contenu d'extension AJOUTÉ ensuite, pas un audit SRD rétroactif.
 * - `'tasha'`, `'xanathar'`, `'fizban'`, `'wbtw'`, `'strixhaven'` — livres d'extension : GATÉS par défaut.
 * - `'homebrew'` — contenu maison : GATÉ par défaut.
 *
 * Comme `ruleset`, cette const n'en porte que l'ensemble des valeurs légales, dont le type
 * et le Zod dérivent (même pattern que [[shared/rules/ruleset.ts]]). Node-safe : aucun
 * import de valeur `~~`/`hub:db`.
 */
export const SOURCES = ['core', 'tasha', 'xanathar', 'fizban', 'wbtw', 'strixhaven', 'homebrew'] as const

/** Union dérivée. Valeur de la colonne `source`. */
export type Source = (typeof SOURCES)[number]

/** Validateur Zod dérivé — à utiliser au lieu d'un `z.enum([…])` recopié. */
export const sourceEnum = z.enum(SOURCES)

/** Source « socle » toujours visible (= DEFAULT de la colonne). */
export const CORE_SOURCE = 'core' satisfies Source

/**
 * Une source est GATÉE (cachée par défaut) ssi ce n'est pas le socle. Unique endroit qui
 * dérive la visibilité de la provenance : découpler les deux plus tard (une entrée `'core'`
 * optionnelle, ou une extension toujours visible) = ne toucher qu'ici.
 */
export function isGatedSource(source: Source): boolean {
  return source !== CORE_SOURCE
}
