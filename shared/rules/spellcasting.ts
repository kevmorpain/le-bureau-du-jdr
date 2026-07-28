/**
 * Types d'incantation — ensemble fermé canonique (cf. decisions.md D6).
 *
 * C'est un **fait d'identité de classe** (cf. rules-engine.md §3 : « grant → effect ;
 * identité → colonne ; décision → choix ») : la valeur vit sur la colonne
 * `classes.spellcasting_type`, cette const n'en porte que l'ensemble des valeurs
 * légales, dont le type et (au besoin) le Zod dérivent.
 *
 * Avant, la table `Nom de classe → type` était recopiée **trois fois** : `CASTER_TYPE`
 * dans `character_sheets/index.post.ts`, `CASTER_TYPE` dans `[id]/level-up.post.ts`,
 * et `spellcasting.type` dans `app/data/character-builder.ts`
 * (cf. architecture-audit.md §7).
 *
 * - `full`  — lanceur complet (Barde, Clerc, Druide, Ensorceleur, Magicien)
 * - `half`  — demi-lanceur, incantation à partir du niveau 2 (Paladin, Rôdeur)
 * - `pact`  — magie de pacte, table d'emplacements propre (Occultiste)
 * - `none`  — pas d'incantation de classe (Barbare, Guerrier, Moine, Roublard) ;
 *             les sous-classes lanceuses (Chevalier occulte, Filou ésotérique) sont
 *             portées par la sous-classe, pas par la classe.
 *
 * En 5.5 (2024) les quatre valeurs restent valides — c'est le **niveau de sous-classe**
 * qui s'uniformise, pas le type d'incantation.
 */
export const SPELLCASTING_TYPES = ['full', 'half', 'pact', 'none'] as const

/** Union dérivée. Valeur de la colonne `classes.spellcasting_type`. */
export type SpellcastingType = (typeof SPELLCASTING_TYPES)[number]

/**
 * Les seuls types qui ont une table d'emplacements de sorts. `'none'` exclu : une
 * fonction qui prend un `CasterType` n'a pas de cas « pas de sorts » à traiter.
 */
export type CasterType = Exclude<SpellcastingType, 'none'>
