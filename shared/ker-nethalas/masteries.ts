import { z } from 'zod'
import { boundedInt } from './zodHelpers'

export const KN_MASTERY_TIERS = 5
export const KN_MAX_TRAINED_MASTERIES = 2

const slug = z.string().regex(/^[a-z][a-zA-Z0-9]{0,39}$/)

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

// Une amulette donne accès à une troisième Maîtrise : une entrée de plus, marquée `amulet`, dont les paliers comptent
// dans les points dépensés comme ceux des Maîtrises apprises.
export const KN_MAX_AMULETS = 1

export const knMasteryPicksSchema = z.array(z.object({
  key: slug,
  tiers: boundedInt({ min: 0, max: KN_MASTERY_TIERS }),
  amulet: z.boolean().optional(),
})).max(KN_MAX_TRAINED_MASTERIES + KN_MAX_AMULETS).superRefine((picks, ctx) => {
  const keys = picks.map(pick => pick.key)
  if (new Set(keys).size !== keys.length) ctx.addIssue({ code: 'custom', message: 'une Maîtrise ne se choisit qu\'une fois' })
  if (picks.filter(pick => pick.amulet).length > KN_MAX_AMULETS) ctx.addIssue({ code: 'custom', message: 'une seule amulette est portée' })
  if (picks.filter(pick => !pick.amulet).length > KN_MAX_TRAINED_MASTERIES) ctx.addIssue({ code: 'custom', message: `${KN_MAX_TRAINED_MASTERIES} Maîtrises apprises au plus` })
  if (picks.some(pick => !pick.amulet && pick.tiers < 1)) ctx.addIssue({ code: 'custom', message: 'une Maîtrise apprise a au moins un palier' })
})

export type KnMasteryPick = z.infer<typeof knMasteryPicksSchema>[number]

const trainedCount = (picks: readonly KnMasteryPick[]) => picks.filter(pick => !pick.amulet).length

export const knAmuletPick = (picks: readonly KnMasteryPick[]) => picks.find(pick => pick.amulet)

// +1 point d'Aptitude à chaque niveau, et 2 au niveau 1 ; chaque aptitude débloquée en coûte un.
export const knAbilityPointsTotal = (level: number) => level + 1

export const knAbilityPointsSpent = (picks: readonly KnMasteryPick[]) => picks.reduce((sum, pick) => sum + pick.tiers, 0)

export const knAbilityPointsUnspent = (level: number, picks: readonly KnMasteryPick[]) =>
  Math.max(0, knAbilityPointsTotal(level) - knAbilityPointsSpent(picks))

// Débloquer se fait du palier 1 au palier 5 ; la première aptitude d'une Maîtrise en débloque aussi le trait.
export function knUnlockMastery(picks: readonly KnMasteryPick[], key: string, level: number): KnMasteryPick[] {
  if (knAbilityPointsUnspent(level, picks) < 1) return [...picks]
  const existing = picks.find(pick => pick.key === key)
  if (!existing) return trainedCount(picks) >= KN_MAX_TRAINED_MASTERIES ? [...picks] : [...picks, { key, tiers: 1 }]
  if (existing.tiers >= KN_MASTERY_TIERS) return [...picks]
  return picks.map(pick => pick.key === key ? { ...pick, tiers: pick.tiers + 1 } : pick)
}

// Corriger une erreur : reprend la dernière aptitude débloquée. Une Maîtrise apprise sans palier disparaît ;
// une amulette reste portée, avec son trait.
export function knLockMastery(picks: readonly KnMasteryPick[], key: string): KnMasteryPick[] {
  return picks.flatMap((pick) => {
    if (pick.key !== key) return [pick]
    if (pick.amulet) return [{ ...pick, tiers: Math.max(0, pick.tiers - 1) }]
    return pick.tiers > 1 ? [{ ...pick, tiers: pick.tiers - 1 }] : []
  })
}

// La Maîtrise d'une amulette ne peut pas être une Maîtrise déjà apprise (hypothèse : le livre ne le dit pas).
export const knCanWearAmulet = (picks: readonly KnMasteryPick[], key: string) =>
  !picks.some(pick => pick.key === key && !pick.amulet)

export function knAddAmulet(picks: readonly KnMasteryPick[], key: string): KnMasteryPick[] {
  if (knAmuletPick(picks) || !knCanWearAmulet(picks, key)) return [...picks]
  return [...picks, { key, tiers: 0, amulet: true }]
}

// Échanger d'amulette garde le nombre d'aptitudes débloquées : seul l'accès à la Maîtrise change.
export function knSwapAmulet(picks: readonly KnMasteryPick[], key: string): KnMasteryPick[] {
  if (!knAmuletPick(picks) || !knCanWearAmulet(picks, key)) return [...picks]
  return picks.map(pick => pick.amulet ? { ...pick, key } : pick)
}

// Corriger une amulette ajoutée par erreur : tant qu'aucun palier n'y est débloqué.
export const knDropAmulet = (picks: readonly KnMasteryPick[]): KnMasteryPick[] =>
  picks.filter(pick => !pick.amulet || pick.tiers > 0)

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
