import { z } from 'zod'
import { knGoalEffectSchema } from './goalEffects'
import { boundedInt } from './zodHelpers'

export const KN_MAX_ACTIVE_GOALS = 2

export const KN_GOAL_BOUNDS = {
  target: { min: 1, max: 99999 },
  progress: { min: 0, max: 99999 },
} as const

const slug = z.string().regex(/^[a-z][a-zA-Z0-9]{0,39}$/)

export const knPersonalGoalSchema = z.object({
  key: slug,
  name: z.string().trim().min(1).max(100),
  objective: z.string().trim().min(1).max(300),
  // Tout objectif se compte : un objectif « en une fois » a pour cible 1.
  target: boundedInt(KN_GOAL_BOUNDS.target),
  reward: z.string().trim().min(1).max(500),
  // Ce que la récompense change sur la fiche ; sans lui, elle ne s'affiche que comme un texte.
  effect: knGoalEffectSchema.optional(),
  recommended: z.boolean().optional(),
})

export const knPersonalGoalsContentSchema = z.array(knPersonalGoalSchema).min(1).max(100).superRefine((goals, ctx) => {
  const seen = new Set<string>()
  goals.forEach((goal, index) => {
    if (seen.has(goal.key)) ctx.addIssue({ code: 'custom', path: [index, 'key'], message: `clé en double : ${goal.key}` })
    seen.add(goal.key)
  })
})

export type KnPersonalGoal = z.infer<typeof knPersonalGoalSchema>

export const knGoalPicksSchema = z.array(z.object({
  key: slug,
  progress: boundedInt(KN_GOAL_BOUNDS.progress),
  // Récompense récupérée : l'objectif ne peut plus être repris ni modifié.
  claimed: z.boolean(),
  // Gain ponctuel de la récompense (XP, amulette, dé de jauge) déjà donné : une annulation puis une nouvelle récupération ne le redonne pas.
  granted: z.boolean().optional(),
})).max(100).superRefine((picks, ctx) => {
  const keys = picks.map(pick => pick.key)
  if (new Set(keys).size !== keys.length) ctx.addIssue({ code: 'custom', message: 'un objectif ne se prend qu\'une fois' })
  if (picks.filter(pick => !pick.claimed).length > KN_MAX_ACTIVE_GOALS) {
    ctx.addIssue({ code: 'custom', message: `${KN_MAX_ACTIVE_GOALS} objectifs en cours au plus` })
  }
})

export type KnGoalPick = z.infer<typeof knGoalPicksSchema>[number]

export const knNewGoalPick = (key: string): KnGoalPick => ({ key, progress: 0, claimed: false })

export const knActiveGoalCount = (picks: readonly KnGoalPick[]) => picks.filter(pick => !pick.claimed).length

export const knGoalReached = (goal: Pick<KnPersonalGoal, 'target'>, pick: Pick<KnGoalPick, 'progress'>) => pick.progress >= goal.target

export const knCanTakeGoal = (picks: readonly KnGoalPick[], key: string) =>
  knActiveGoalCount(picks) < KN_MAX_ACTIVE_GOALS && !picks.some(pick => pick.key === key)

export function knTakeGoal(picks: readonly KnGoalPick[], key: string): KnGoalPick[] {
  return knCanTakeGoal(picks, key) ? [...picks, knNewGoalPick(key)] : [...picks]
}

export function knSetGoalProgress(picks: readonly KnGoalPick[], key: string, progress: number): KnGoalPick[] {
  const value = Math.min(KN_GOAL_BOUNDS.progress.max, Math.max(KN_GOAL_BOUNDS.progress.min, Math.trunc(progress)))
  return picks.map(pick => pick.key === key && !pick.claimed ? { ...pick, progress: value } : pick)
}

export function knClaimGoal(picks: readonly KnGoalPick[], goal: KnPersonalGoal): KnGoalPick[] {
  return picks.map(pick => pick.key === goal.key && !pick.claimed && knGoalReached(goal, pick) ? { ...pick, claimed: true } : pick)
}

// Corriger une erreur : un objectif récupéré par mégarde redevient en cours, s'il reste de la place pour lui.
export function knUnclaimGoal(picks: readonly KnGoalPick[], key: string): KnGoalPick[] {
  if (knActiveGoalCount(picks) >= KN_MAX_ACTIVE_GOALS) return [...picks]
  return picks.map(pick => pick.key === key && pick.claimed ? { ...pick, claimed: false } : pick)
}

// Un objectif choisi par erreur se retire tant qu'aucun progrès n'y est noté ; ensuite, il ne se change plus.
export const knDropGoal = (picks: readonly KnGoalPick[], key: string): KnGoalPick[] =>
  picks.filter(pick => pick.key !== key || pick.claimed || pick.progress > 0)

export function knGoalPickIssues(keys: readonly string[], available: readonly string[] | null): string[] {
  if (available === null) return keys.length ? ['le contenu des objectifs personnels n\'est pas chargé'] : []

  const issues: string[] = []
  if (keys.length !== KN_MAX_ACTIVE_GOALS) issues.push(`il faut choisir ${KN_MAX_ACTIVE_GOALS} objectifs`)
  if (new Set(keys).size !== keys.length) issues.push('deux objectifs différents sont attendus')
  for (const key of keys) {
    if (!available.includes(key)) issues.push(`objectif inconnu : ${key}`)
  }
  return issues
}
