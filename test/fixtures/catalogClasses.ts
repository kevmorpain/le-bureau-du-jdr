import type { Effect } from '../../server/db/schema/effects'
import { CLASS_PROFICIENCIES, type ProficiencySet } from '../../shared/rules/classProficiencies'
import { CLASS_IDENTITY } from './classIdentity'

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
