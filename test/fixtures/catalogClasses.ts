import type { Effect } from '../../server/db/schema/effects'
import { CLASS_PROFICIENCIES, type ProficiencySet } from '../../shared/rules/classProficiencies'
import { SKILL_KEYS } from '../../shared/rules/skills'
import type { CatalogProgression } from '../../shared/rules/resolve'
import { CLASS_SKILL_CHOICES } from '../../server/db/seeds/data/classSkills'
import { CLASS_IDENTITY } from './classIdentity'

/** Point « Compétences de classe » de `/api/catalog/progressions`, liste `all` développée comme le fait `buildCatalog`. */
export function classSkillProgression(progressionId: number, ownerClassId: number, className: string): CatalogProgression {
  const { count, from } = CLASS_SKILL_CHOICES[className]!
  return {
    progressionId,
    ownerClassId,
    ownerLevelRequired: 1,
    kind: 'skill',
    count: { op: 'fixed', value: count },
    optionSource: { type: 'skills', from },
    replaceable: false,
    options: (from === 'all' ? SKILL_KEYS : from).map(value => ({ value })),
  }
}

/** Effets d'un porteur de maîtrises, tels que `seedClass` les émet. */
export function proficiencyEffects(set: ProficiencySet): Effect[] {
  return [
    ...set.armor.map((value): Effect => ({ type: 'proficiency', value })),
    ...set.weapon.map((value): Effect => ({ type: 'weapon_proficiency', value })),
    ...set.tools.map((value): Effect => ({ type: 'tool_proficiency', value })),
  ]
}

/**
 * Réponse de `/api/catalog/classes` pour les 12 classes 2014, telle que la produit une base seedée : identité
 * du contrat `classIdentity.ts`, maîtrises des porteurs construits depuis `CLASS_PROFICIENCIES`.
 * Id = rang dans `CLASS_IDENTITY` + 1 (Guerrier 5, Paladin 7, Roublard 9, Magicien 12).
 */
export function catalogClasses() {
  return CLASS_IDENTITY.map((c, i) => {
    const prof = CLASS_PROFICIENCIES[c.dbName]!
    return {
      id: i + 1,
      name: c.dbName,
      subclassLevel: c.subclassLevel,
      multiclassSkillCount: c.multiclassSkillCount,
      multiclassPrerequisites: c.multiclassPrerequisites,
      subclasses: [],
      proficiencies: {
        start: proficiencyEffects(prof),
        savingThrows: prof.savingThrows.map((ability): Effect => ({ type: 'saving_throw_proficiency', value: { ability } })),
        multiclass: proficiencyEffects(prof.multiclass),
      },
    }
  })
}
