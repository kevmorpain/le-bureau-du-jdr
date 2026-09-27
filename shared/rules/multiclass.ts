import { resolveChoices, type Catalog } from './resolve'
import type { AbilityKey } from './abilities'
import type { SkillKey } from './skills'

// Prérequis de multiclassage d'une classe : alternatives (OU) de minimums (ET) — Guerrier
// [{ str: 13 }, { dex: 13 }], Moine [{ dex: 13, wis: 13 }] ; `[]` = aucun.
export type MulticlassPrerequisites = Partial<Record<AbilityKey, number>>[]

export function meetsMulticlassPrerequisites(prerequisites: MulticlassPrerequisites, scores: Partial<Record<AbilityKey, number>>): boolean {
  return prerequisites.length === 0 || prerequisites.some(group =>
    Object.entries(group).every(([ability, min]) => (scores[ability as AbilityKey] ?? 0) >= (min ?? 0)))
}

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
