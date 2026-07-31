import { z } from 'zod'

/**
 * Propriétés de maîtrise d'armes (« weapon mastery ») — ensemble fermé canonique des
 * règles 2024 (cf. decisions.md D6, dnd-5.5.md §2 « Maîtrise d'armes : nouvelle
 * mécanique »). Nouveauté 5.5, absente en 2014 : chaque arme porte AU PLUS une propriété
 * de maîtrise, débloquée par les classes martiales.
 *
 * Source unique de vérité : le type `MasteryProperty`, le validateur Zod
 * `masteryPropertyEnum` et la colonne `items.mastery_property` en DÉRIVENT. Comme tout
 * autre ensemble fermé du dépôt (`DamageTypeKey`, `WeaponProperty`, `FeatureTag`…), la
 * const ne porte que des **clés machine anglaises** ; les libellés français vivent dans
 * l'i18n (cf. decisions.md D11), pas ici.
 *
 * Libellés FR canoniques (AideDD, règles 2024 — https://www.aidedd.org/regles-24/equipement/armes/,
 * mappés par l'effet de chaque propriété) :
 * - `cleave`  → « Enchaînement » : attaque une 2ᵉ créature à portée.
 * - `graze`   → « Écorchure »    : inflige le modificateur de caractéristique même à l'échec.
 * - `nick`    → « Coup double »  : l'attaque supplémentaire (Légère) devient part de l'action Attaque.
 * - `push`    → « Poussée »      : repousse la cible d'un maximum de 3 m.
 * - `sap`     → « Sape »         : la cible subit un Désavantage à sa prochaine attaque.
 * - `slow`    → « Ralentissement » : réduit la Vitesse de la cible de 3 m.
 * - `topple`  → « Renversement » : force un jet de sauvegarde de Constitution (chute).
 * - `vex`     → « Ouverture »    : Avantage à votre prochaine attaque contre la cible.
 *
 * Ordre alphabétique (comme `DamageTypeKey`). Le contenu 5.5 (quelles armes portent
 * quelle maîtrise) est seedé en Phase 2 ; ici on ne pose que l'ensemble et la colonne.
 */
export const MASTERY_PROPERTIES = ['cleave', 'graze', 'nick', 'push', 'sap', 'slow', 'topple', 'vex'] as const

/** Union dérivée. Valeur de la colonne `items.mastery_property`. */
export type MasteryProperty = (typeof MASTERY_PROPERTIES)[number]

/** Validateur Zod dérivé — à utiliser au lieu d'un `z.enum([…])` recopié. */
export const masteryPropertyEnum = z.enum(MASTERY_PROPERTIES)
