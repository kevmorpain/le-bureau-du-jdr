import { resolveChoices, type Catalog } from './resolve'
import type { SkillKey } from './skills'

export interface MulticlassSkillGrant {
  count: number
  options: SkillKey[]
}

// PHB 2014 (maîtrises du multiclassage) : la compétence gagnée en rejoignant une classe se choisit dans
// la liste de compétences de cette classe — « au choix » pour le Barde, dont la liste est `all`.
export function multiclassSkillGrant(classId: number, multiclassSkillCount: number, catalog: Catalog): MulticlassSkillGrant {
  if (multiclassSkillCount <= 0) return { count: 0, options: [] }
  const classSkillChoice = resolveChoices({ classLevels: { [classId]: 1 } }, catalog).choices.find(c => c.kind === 'skill')
  return {
    count: multiclassSkillCount,
    options: (classSkillChoice?.options ?? []).map(o => o.value as SkillKey),
  }
}
