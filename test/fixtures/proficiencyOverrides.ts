import type { ProficiencyOverrideRow } from '../../shared/rules/proficiencyOverrides'

export interface ManualLevel {
  skillKey: string
  proficiencyLevel: 'proficient' | 'expert'
}

/** Ajouts manuels qui portent une compétence ou un jet de sauvegarde (`<carac>_save`) au niveau voulu. */
export const overridesFor = (levels: readonly ManualLevel[]): ProficiencyOverrideRow[] =>
  levels.map(({ skillKey, proficiencyLevel }) => {
    const save = skillKey.endsWith('_save')
    return {
      proficiencyType: save ? 'saving_throw' : 'skill',
      value: save ? skillKey.slice(0, -'_save'.length) : skillKey,
      action: proficiencyLevel === 'expert' ? 'expertise' : 'grant',
    }
  })
