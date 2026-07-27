import { z } from 'zod'

/**
 * Les 6 caractéristiques D&D 5e — ensemble fermé canonique (cf. decisions.md D6).
 *
 * Source unique de vérité : le type `AbilityKey`, le validateur Zod `abilityEnum`
 * et (à terme) la table `ability_scores` en DÉRIVENT. Plus aucune union/enum de
 * caractéristiques ni `z.enum(['str', …])` recopié à la main (cf. architecture-audit.md §6).
 *
 * Les libellés (« Force », « Dextérité »…) vivent dans l'i18n sous `ability_scores.<clé>`
 * (cf. decisions.md D11) — cette const ne porte QUE la structure.
 *
 * L'association compétence ⇄ caractéristique est portée par `skills.ts` (chaque
 * compétence référence sa caractéristique), pas l'inverse, pour éviter toute
 * duplication (D6).
 */
export const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const

/** Union dérivée des clés machine. */
export type AbilityKey = (typeof ABILITY_KEYS)[number]

/** Validateur Zod dérivé — à utiliser au lieu de `z.enum(['str', …])`. */
export const abilityEnum = z.enum(ABILITY_KEYS)

/** Clé de maîtrise d'un jet de sauvegarde (`'con_save'`, `'wis_save'`…). */
export type SavingThrowKey = `${AbilityKey}_save`

/**
 * Les jets de sauvegarde partagent la table des maîtrises de compétences
 * (`character_skills.skill_key`) sous la convention `<carac>_save`. Cette fonction
 * en porte la formulation, pour que l'effet `saving_throw_proficiency` et les JS
 * de classe stockés à la création se projettent sur la MÊME clé.
 */
export const savingThrowKey = (ability: AbilityKey): SavingThrowKey => `${ability}_save`
