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
] as const

export type ChoiceKind = (typeof CHOICE_KINDS)[number]

export const choiceKindEnum = z.enum(CHOICE_KINDS)

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
  | { type: 'tools', from?: string[] }
  | { type: 'abilities', from: AbilityKey[], distributions: ('2+1' | '1+1+1')[] }
  | { type: 'spells', spellClass: string, maxLevel?: number, cantripsOnly?: boolean }
  | { type: 'feats', category?: FeatCategory }
