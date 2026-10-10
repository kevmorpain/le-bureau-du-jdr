import { z } from 'zod'
import { boundedInt } from './zodHelpers'

export const KN_MASTERY_TIERS = 5
export const KN_MAX_TRAINED_MASTERIES = 2

export const knMasteryKeySchema = z.string().regex(/^[a-z][a-zA-Z0-9]{0,39}$/)
const slug = knMasteryKeySchema

export const knMasteryAbilitySchema = z.object({
  tier: boundedInt({ min: 1, max: KN_MASTERY_TIERS }),
  name: z.string().trim().min(1).max(100),
  action: z.string().trim().min(1).max(100),
  magical: z.boolean(),
  sustained: z.boolean(),
  cost: z.string().trim().max(60),
  // Coût numérique en Éther ; `null` pour un coût spécial ou une aptitude passive.
  aether: boundedInt({ min: 0, max: 99 }).nullable(),
  text: z.string().trim().min(1).max(2000),
})

const knMasteryTextSchema = z.object({
  name: z.string().trim().min(1).max(100),
  text: z.string().trim().min(1).max(2000),
})

export const KN_MASTERY_TRAINING_COUNT = 6

export const knMasterySchema = z.object({
  key: slug,
  name: z.string().trim().min(1).max(100),
  summary: z.string().trim().min(1).max(1000),
  feature: knMasteryTextSchema,
  abilities: z.array(knMasteryAbilitySchema).length(KN_MASTERY_TIERS).superRefine((abilities, ctx) => {
    abilities.forEach((ability, index) => {
      if (ability.tier !== index + 1) ctx.addIssue({ code: 'custom', path: [index, 'tier'], message: `le palier ${index + 1} est attendu à cette place` })
    })
  }),
  // Table « Où vous êtes-vous entraîné ? » (D6).
  training: z.array(knMasteryTextSchema).length(KN_MASTERY_TRAINING_COUNT),
})

export const knMasteriesContentSchema = z.array(knMasterySchema).min(1).max(40).superRefine((masteries, ctx) => {
  const seen = new Set<string>()
  masteries.forEach((mastery, index) => {
    if (seen.has(mastery.key)) ctx.addIssue({ code: 'custom', path: [index, 'key'], message: `clé en double : ${mastery.key}` })
    seen.add(mastery.key)
  })
})

export type KnMasteryAbility = z.infer<typeof knMasteryAbilitySchema>
export type KnMastery = z.infer<typeof knMasterySchema>

export const knMasteryPicksSchema = z.array(z.object({
  key: slug,
  tiers: boundedInt({ min: 1, max: KN_MASTERY_TIERS }),
})).max(KN_MAX_TRAINED_MASTERIES).superRefine((picks, ctx) => {
  const keys = picks.map(pick => pick.key)
  if (new Set(keys).size !== keys.length) ctx.addIssue({ code: 'custom', message: 'une Maîtrise ne se choisit qu\'une fois' })
})

export type KnMasteryPick = z.infer<typeof knMasteryPicksSchema>[number]

// +1 point d'Aptitude à chaque niveau, et 2 au niveau 1 ; chaque aptitude débloquée en coûte un, y compris celles de
// la Maîtrise d'une amulette (`amuletTiers`).
export const knAbilityPointsTotal = (level: number) => level + 1

export const knAbilityPointsSpent = (picks: readonly KnMasteryPick[], amuletTiers = 0) =>
  picks.reduce((sum, pick) => sum + pick.tiers, amuletTiers)

export const knAbilityPointsUnspent = (level: number, picks: readonly KnMasteryPick[], amuletTiers = 0) =>
  Math.max(0, knAbilityPointsTotal(level) - knAbilityPointsSpent(picks, amuletTiers))

// Débloquer se fait du palier 1 au palier 5 ; la première aptitude d'une Maîtrise en débloque aussi le trait.
export function knUnlockMastery(picks: readonly KnMasteryPick[], key: string, level: number, amuletTiers = 0): KnMasteryPick[] {
  if (knAbilityPointsUnspent(level, picks, amuletTiers) < 1) return [...picks]
  const existing = picks.find(pick => pick.key === key)
  if (!existing) return picks.length >= KN_MAX_TRAINED_MASTERIES ? [...picks] : [...picks, { key, tiers: 1 }]
  if (existing.tiers >= KN_MASTERY_TIERS) return [...picks]
  return picks.map(pick => pick.key === key ? { ...pick, tiers: pick.tiers + 1 } : pick)
}

// Corriger une erreur : reprend la dernière aptitude débloquée, et retire la Maîtrise quand il n'en reste plus.
export function knLockMastery(picks: readonly KnMasteryPick[], key: string): KnMasteryPick[] {
  return picks.flatMap((pick) => {
    if (pick.key !== key) return [pick]
    return pick.tiers > 1 ? [{ ...pick, tiers: pick.tiers - 1 }] : []
  })
}

export function knMasteryPickIssues(keys: readonly string[], available: readonly string[] | null): string[] {
  if (available === null) return keys.length ? ['le contenu des Maîtrises n\'est pas chargé'] : []

  const issues: string[] = []
  if (keys.length !== KN_MAX_TRAINED_MASTERIES) issues.push(`il faut choisir ${KN_MAX_TRAINED_MASTERIES} Maîtrises`)
  if (new Set(keys).size !== keys.length) issues.push('deux Maîtrises différentes sont attendues')
  for (const key of keys) {
    if (!available.includes(key)) issues.push(`Maîtrise inconnue : ${key}`)
  }
  return issues
}
