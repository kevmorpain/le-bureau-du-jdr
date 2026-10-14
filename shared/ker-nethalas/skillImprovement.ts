import type { KnExtraSkill, KnSkills } from './character'
import { knRollDie, type KnRng } from './run'
import { KN_SKILL_KEYS, type KnSkillKey } from './skills'

export const KN_SKILL_IMPROVEMENT = { die: 100, gainDie: 4, max: 80 } as const

export interface KnSkillImprovement {
  roll: number
  success: boolean
  gain: number
  before: number
  after: number
}

// Un score déjà au plafond (ou au-delà, par un objet) ne baisse jamais.
export function knImproveSkill(score: number, rng: KnRng = Math.random): KnSkillImprovement {
  const roll = knRollDie(KN_SKILL_IMPROVEMENT.die, rng)
  const success = roll > score
  const rolled = success ? knRollDie(KN_SKILL_IMPROVEMENT.gainDie, rng) : 1
  const after = Math.max(score, Math.min(KN_SKILL_IMPROVEMENT.max, score + rolled))
  return { roll, success, gain: after - score, before: score, after }
}

export type KnSkillTarget = { skill: KnSkillKey } | { extra: number }

export interface KnMarkedImprovement extends KnSkillImprovement {
  target: KnSkillTarget
}

export interface KnImprovementResult {
  skills: KnSkills
  extraSkills: KnExtraSkill[]
  improvements: KnMarkedImprovement[]
}

// Chaque compétence marquée passe son test d'amélioration au camp, puis n'est plus marquée.
export function knImproveMarkedSkills(skills: KnSkills, extraSkills: readonly KnExtraSkill[], rng: KnRng = Math.random): KnImprovementResult {
  const improvements: KnMarkedImprovement[] = []
  const nextSkills = { ...skills }
  for (const key of KN_SKILL_KEYS) {
    if (!skills[key].marked) continue
    const improvement = knImproveSkill(skills[key].score, rng)
    nextSkills[key] = { score: improvement.after, marked: false }
    improvements.push({ ...improvement, target: { skill: key } })
  }
  const nextExtra = extraSkills.map((extra, index) => {
    if (!extra.marked) return extra
    const improvement = knImproveSkill(extra.score, rng)
    improvements.push({ ...improvement, target: { extra: index } })
    return { ...extra, score: improvement.after, marked: false }
  })
  return { skills: nextSkills, extraSkills: nextExtra, improvements }
}
