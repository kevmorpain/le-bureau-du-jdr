import { z } from 'zod'
import type { FeatureTag } from './featureTags'
import type { FeatCategory } from './featCategories'
import type { SkillKey } from './skills'
import type { AbilityKey } from './abilities'

export type { FeatCategory } from './featCategories'

// `kind` au pluriel (`invocations`) nomme le point de choix ; le `FeatureTag` au singulier nomme le groupe d'options.
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
  'terrain',
  'spellcasting_ability',
] as const

export type ChoiceKind = (typeof CHOICE_KINDS)[number]

export const choiceKindEnum = z.enum(CHOICE_KINDS)

// Point de choix déclaré par un seed sur une feature (trait d'espèce ou de lignée, porteur de classe ou
// d'historique), `count` fixe.
export interface FeatureChoice {
  kind: ChoiceKind
  count: number
  optionSource: OptionSource
}

// Choix dont chaque pick est une maîtrise (valeur typée sans table), un sort mineur ou un simple libellé (terrain
// du Cercle de la terre, caractéristique d'incantation de la Fadette) : ils passent par un chemin générique
// (`choicePicks`). Les autres ont chacun leur champ dédié. Seules les maîtrises se dérivent en effets ; un
// libellé est lu tel quel par ce qui en dépend.
export const VALUE_CHOICE_KINDS = ['skill', 'tool', 'language'] as const satisfies readonly ChoiceKind[]
export const SPELL_CHOICE_KINDS = ['cantrip'] as const satisfies readonly ChoiceKind[]
export const LABEL_CHOICE_KINDS = ['terrain', 'spellcasting_ability'] as const satisfies readonly ChoiceKind[]
export const PICK_CHOICE_KINDS: readonly ChoiceKind[] = [...VALUE_CHOICE_KINDS, ...SPELL_CHOICE_KINDS, ...LABEL_CHOICE_KINDS]

// `proficient_skills` / `proficient_weapons` se résolvent contre l'état du perso (non cachables) ; le reste via le catalogue.
export type OptionSource =
  | { type: 'enum', values: string[] }
  | { type: 'subclasses' }
  | { type: 'lineages' } // sous-races 2014 / lignées 2024 de l'espèce propriétaire (D17)
  | { type: 'feature_group', group: FeatureTag }
  | { type: 'skills', from: SkillKey[] | 'all' }
  | { type: 'proficient_skills' }
  | { type: 'proficient_weapons' } // maîtrise d'armes 5.5 : N armes parmi celles déjà maîtrisées
  | { type: 'languages', from?: string[] }
  // `orLanguages` : une langue au choix peut remplacer l'outil (Marchand de guilde, AideDD).
  | { type: 'tools', from?: string[], orLanguages?: boolean }
  | { type: 'abilities', from: AbilityKey[], distributions: ('2+1' | '1+1+1')[] }
  | { type: 'spells', spellClass: string, maxLevel?: number, cantripsOnly?: boolean }
  | { type: 'feats', category?: FeatCategory }
