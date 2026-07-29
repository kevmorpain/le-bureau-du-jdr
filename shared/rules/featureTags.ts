import { z } from 'zod'

/**
 * Groupes de features-options (« feature groups ») — ensemble fermé canonique
 * (cf. decisions.md D6, rules-engine.md §4).
 *
 * Un `tag` marque une feature qui est une **option** au sein d'un groupe : le point
 * de choix correspondant (une `progression` de `kind` adéquat, lot 4c) énumère ses
 * candidats via `optionSource: { type: 'feature_group', group: FeatureTag }`, résolu
 * par `SELECT … FROM features WHERE tag = <group>` (d'où la colonne indexable
 * `features.tag`, cf. rules-engine.md §4 « Companion »).
 *
 * C'est un **fait d'identité** porté par la colonne `features.tag` (cf.
 * rules-engine.md §3 : « identité → colonne ») ; cette const n'en porte que
 * l'ensemble des valeurs légales, dont le type et le Zod dérivent. Même pattern que
 * [[shared/rules/spellcasting.ts]] livré en lot 4a.
 *
 * - `invocation`     — manifestations occultes de l'Occultiste (les seules à exister
 *                      déjà comme features individuelles, `feature_type =
 *                      'eldritch_invocation'` ; taguées par le backfill du lot 4b)
 * - `metamagic`      — options de Métamagie de l'Ensorceleur
 * - `maneuver`       — manœuvres du Maître de guerre (sous-classe du Guerrier)
 * - `fighting_style` — styles de combat (Guerrier, Paladin, Rôdeur…)
 * - `pact_boon`      — faveurs de pacte de l'Occultiste (Chaîne / Lame / Tome)
 *
 * ⚠️ Sauf `invocation`, ces groupes n'ont aujourd'hui que des features **conteneurs
 * en prose** (une seule feature qui décrit les options dans sa description) ; leurs
 * features-options — et donc leur tag — n'apparaîtront qu'au lot 4c, quand
 * `progression` les matérialisera. Les valeurs sont néanmoins figées ici pour que
 * `OptionSource` (4c) et le schéma les référencent dès maintenant.
 */
export const FEATURE_TAGS = ['invocation', 'metamagic', 'maneuver', 'fighting_style', 'pact_boon'] as const

/** Union dérivée. Valeur de la colonne `features.tag`. */
export type FeatureTag = (typeof FEATURE_TAGS)[number]

/** Validateur Zod dérivé — à utiliser au lieu d'un `z.enum([…])` recopié. */
export const featureTagEnum = z.enum(FEATURE_TAGS)
