import type { FeatureDef } from '../lib/seedClass'
import type { SkillKey } from '~~/shared/rules/skills'

// Choix de compétences de classe (PHB 2014) : N compétences dans une liste (Barde = n'importe laquelle).
// Owner INVISIBLE (`choice_carrier`) : le pick n'est pas une feature affichée mais une maîtrise dérivée
// du choix (character_choices), comme les compétences d'historique/JS (F3). Valeurs sourcées du blob CLASSES.
export const CLASS_SKILL_CHOICES: Record<string, { count: number, from: SkillKey[] | 'all' }> = {
  Barbare: { count: 2, from: ['animal_handling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'] },
  Barde: { count: 3, from: 'all' },
  Clerc: { count: 2, from: ['history', 'insight', 'medicine', 'persuasion', 'religion'] },
  Druide: { count: 2, from: ['arcana', 'animal_handling', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival'] },
  Guerrier: { count: 2, from: ['acrobatics', 'animal_handling', 'athletics', 'history', 'insight', 'intimidation', 'perception', 'survival'] },
  Moine: { count: 2, from: ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth'] },
  Paladin: { count: 2, from: ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'] },
  Rôdeur: { count: 3, from: ['animal_handling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'] },
  Roublard: { count: 4, from: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'performance', 'persuasion', 'sleight_of_hand', 'stealth'] },
  Ensorceleur: { count: 2, from: ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'] },
  Occultiste: { count: 2, from: ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion'] },
  Magicien: { count: 2, from: ['arcana', 'history', 'insight', 'investigation', 'medicine', 'religion'] },
}

export const CLASS_SKILL_CHOICE_OWNER_NAME = 'Compétences de classe'

export function classSkillChoiceFeature(className: string): FeatureDef | null {
  const choice = CLASS_SKILL_CHOICES[className]
  if (!choice) return null
  return {
    name: CLASS_SKILL_CHOICE_OWNER_NAME,
    description: null,
    featureType: 'choice_carrier',
    levelRequired: 1,
    effects: [],
    progression: {
      kind: 'skill',
      count: { op: 'fixed', value: choice.count },
      optionSource: { type: 'skills', from: choice.from },
      replaceable: false,
    },
  }
}
