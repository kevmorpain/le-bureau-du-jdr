import type { ProficiencyOverrideType } from '~~/server/db/schema/character_proficiency_overrides'

export interface ProficiencyOverrideRow {
  proficiencyType: string
  value: string
  action: string
}

// Maîtrises d'un type : celles des effets, plus les ajouts manuels, moins les retraits manuels.
export function withProficiencyOverrides(
  fromEffects: readonly string[],
  overrides: readonly ProficiencyOverrideRow[],
  type: ProficiencyOverrideType,
): string[] {
  const valuesFor = (action: 'grant' | 'revoke') =>
    overrides.filter(o => o.proficiencyType === type && o.action === action).map(o => o.value)
  const revoked = new Set(valuesFor('revoke'))
  return [...new Set([...fromEffects, ...valuesFor('grant')])].filter(p => !revoked.has(p))
}
