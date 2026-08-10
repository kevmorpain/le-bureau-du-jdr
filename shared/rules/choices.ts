import { z } from 'zod'
import type { FeatureTag } from './featureTags'
import type { SkillKey } from './skills'
import type { AbilityKey } from './abilities'

/**
 * Modèle de choix — ensemble fermé canonique du `kind` d'un point de choix, plus le
 * type `OptionSource` qui décrit « parmi quoi » on choisit (cf. decisions.md D4/D5/D6,
 * rules-engine.md §4).
 *
 * Une ligne `progression` (référence) porte un `kind` + un `count` (JSON<Formula>) +
 * un `optionSource` ; une ligne `character_choices` (config) enregistre le pick. La
 * const ne porte que l'ensemble des `kind` légaux, dont le type et le Zod dérivent —
 * même pattern que [[shared/rules/featureTags.ts]] (4b) et [[shared/rules/spellcasting.ts]] (4a).
 *
 * ⚠️ Nuances de nombre voulues : `invocations`/`maneuvers` (pluriel) désignent des
 * points de choix qui piochent PLUSIEURS options, alors que le `FeatureTag` du groupe
 * correspondant est au singulier (`invocation`/`maneuver`). Ce n'est pas une faute :
 * `kind` nomme le point de choix, `FeatureTag` nomme le groupe d'options.
 */
export const CHOICE_KINDS = [
  'subclass',
  'lineage',
  'pact_boon',
  'fighting_style',
  'expertise',
  'invocations',
  'asi_or_feat',
  'metamagic',
  'maneuvers',
  'ability_scores',
  'skill',
  'language',
  'tool',
  'cantrip',
  'spell',
  'ancestry',
  'weapon_mastery',
] as const

/** Union dérivée. Valeur de la colonne `progression.kind`. */
export type ChoiceKind = (typeof CHOICE_KINDS)[number]

/** Validateur Zod dérivé — à utiliser au lieu d'un `z.enum([…])` recopié. */
export const choiceKindEnum = z.enum(CHOICE_KINDS)

/**
 * Catégorie de don (Origine / Général / Style de combat / Faveur épique en 5.5).
 * Pas encore modélisée en base — les dons ne portent pas de colonne `category` avant
 * la Phase 2. Typée `string` pour l'instant ; deviendra une union dérivée (D6) le jour
 * où les dons seront catégorisés. Référencée seulement par `OptionSource` (`feats`).
 */
export type FeatCategory = string

/**
 * « Parmi quoi » un point de choix propose ses options (cf. rules-engine.md §4). JSON
 * stocké sur `progression.optionSource`. Le catalogue (`enum`, `subclasses`,
 * `feature_group`, `spells`, `feats`) se résout sans l'état du perso ; la projection
 * perso (`proficient_skills`) s'y résout — cf. la scission catalogue / projection en §5.
 *
 * `feature_group` s'appuie sur la colonne indexable `features.tag` (4b) :
 * `SELECT … FROM features WHERE tag = <group>`.
 *
 * `proficient_skills` / `proficient_weapons` se résolvent LIVE contre l'état du perso
 * (compétences / armes déjà maîtrisées) — non cachables, cf. la scission §5.
 */
export type OptionSource =
  | { type: 'enum', values: string[] }
  | { type: 'subclasses' }
  | { type: 'lineages' } // sous-races 2014 / lignées 2024 de l'espèce propriétaire (D17)
  | { type: 'feature_group', group: FeatureTag }
  | { type: 'skills', from: SkillKey[] | 'all' }
  | { type: 'proficient_skills' }
  | { type: 'proficient_weapons' } // maîtrise d'armes 5.5 : N armes parmi celles déjà maîtrisées
  | { type: 'languages', from?: string[] }
  | { type: 'tools', from?: string[] }
  | { type: 'abilities', from: AbilityKey[], distributions: ('2+1' | '1+1+1')[] }
  | { type: 'spells', spellClass: string, maxLevel?: number, cantripsOnly?: boolean }
  | { type: 'feats', category?: FeatCategory }
