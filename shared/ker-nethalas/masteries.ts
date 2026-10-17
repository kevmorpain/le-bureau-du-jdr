import { z } from 'zod'
import { KN_PROVISION_KEYS } from './camp'
import { KN_DAMAGE_TYPES } from './catalog/damageTypes'
import { knDiceSchema } from './dice'
import { KN_VITAL_KEYS } from './effects'
import { KN_STATUS_BOUNDS, KN_USE_LIMITS, knCustomEntrySchema } from './status'
import { boundedInt } from './zodHelpers'

export const KN_MASTERY_TIERS = 5
export const KN_MAX_TRAINED_MASTERIES = 2

export const knMasteryKeySchema = z.string().regex(/^[a-z][a-zA-Z0-9]{0,39}$/)
const slug = knMasteryKeySchema

// Effets que le moteur applique à la fiche : ceux d'un trait tant que la Maîtrise est possédée, ceux d'une aptitude tant
// qu'elle est débloquée (et allumée, si elle est Maintenue). Le texte reste la référence pour tout le reste.
const knMasteryEffectsSchema = z.array(knCustomEntrySchema).max(KN_STATUS_BOUNDS.customEntries)

const knCostSchema = boundedInt({ min: 0, max: 99 })

const knVitalKeySchema = z.enum(KN_VITAL_KEYS)

// Ce qu'une aptitude fait au survivant lui-même, avec un jet de dés : soigner des Blessures (Robustesse puis Santé),
// récupérer une jauge, gagner des points temporaires.
export const knSelfEffectSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('woundsHeal'), dice: knDiceSchema }),
  z.object({ kind: z.literal('recover'), vital: knVitalKeySchema, dice: knDiceSchema }),
  z.object({ kind: z.literal('temporary'), vital: knVitalKeySchema, dice: knDiceSchema }),
])

export type KnSelfEffect = z.infer<typeof knSelfEffectSchema>

const knSelfEffectsSchema = z.array(knSelfEffectSchema).max(4)

const knCampCheckSchema = boundedInt({ min: -20, max: 20 })

const knProvisionDeltaSchema = z.record(z.enum(KN_PROVISION_KEYS), boundedInt({ min: 1, max: 99 }))

// Une activité de camp qu'un trait ajoute à celles du livre. L'Épuisement et le modificateur du test de Camp se paient une
// fois quelle que soit la quantité, `consumes` et `produces` par unité ; `quantity` en fait une activité à quantité, sinon
// on la fait ou non. `recover` s'applique une fois, à la fin du camp.
export const knCampActivitySchema = z.object({
  name: z.string().trim().min(1).max(100),
  exhaustion: knCostSchema,
  check: knCampCheckSchema,
  consumes: knProvisionDeltaSchema.optional(),
  produces: knProvisionDeltaSchema.optional(),
  quantity: z.boolean().optional(),
  recover: knSelfEffectsSchema.optional(),
})

export type KnCampActivity = z.infer<typeof knCampActivitySchema>

const knTypedDiceSchema = z.object({ dice: knDiceSchema, type: z.enum(KN_DAMAGE_TYPES).optional() })

// Ce qu'une aptitude change à l'attaque du survivant. Une aptitude non Maintenue se coche dans l'attaque : elle se paie et
// s'applique à celle qu'on lance. Une aptitude Maintenue s'applique à toutes les attaques tant qu'elle est allumée.
export const knAbilityAttackSchema = z.object({
  // Bonus ou malus au jet d'attaque.
  bonus: boundedInt({ min: -99, max: 99 }).optional(),
  // Dés et bonus ajoutés à la réserve de dégâts, avec leur type quand il diffère de celui de l'arme.
  dice: z.array(knTypedDiceSchema).max(3).optional(),
  // Tient lieu de réserve de l'arme.
  pool: z.array(knTypedDiceSchema).max(3).optional(),
  // Une touche est un Coup critique.
  critical: z.boolean().optional(),
  // La cible ne se défend pas.
  undefendable: z.boolean().optional(),
  // Une seconde attaque gratuite contre la même cible si celle-ci touche ; `dice` en remplace la réserve.
  followUp: z.object({ dice: z.array(knTypedDiceSchema).max(3).optional() }).optional(),
  // Une attaque contre chaque adversaire.
  allTargets: z.boolean().optional(),
  // Marque une cible : ses attaques suivantes contre elle reçoivent `bonus` et `dice` (une fois par adversaire).
  mark: z.boolean().optional(),
  // Bonus ou malus au prochain test défensif du survivant.
  afterDefense: boundedInt({ min: -99, max: 99 }).optional(),
  // Le survivant ne se défend plus jusqu'à sa prochaine attaque.
  noDefense: z.boolean().optional(),
})

export type KnAbilityAttack = z.infer<typeof knAbilityAttackSchema>

export const knMasteryAbilitySchema = z.object({
  tier: boundedInt({ min: 1, max: KN_MASTERY_TIERS }),
  name: z.string().trim().min(1).max(100),
  action: z.string().trim().min(1).max(100),
  magical: z.boolean(),
  sustained: z.boolean(),
  cost: z.string().trim().max(60),
  // Coût numérique en Éther ; `null` pour un coût spécial ou une aptitude passive. Une aptitude Maintenue retranche ce
  // coût de l'Éther maximum tant qu'elle dure, au lieu de le dépenser.
  aether: knCostSchema.nullable(),
  exhaustion: knCostSchema.optional(),
  health: knCostSchema.optional(),
  // Tient lieu de source de lumière tant qu'elle est active.
  light: z.boolean().optional(),
  effects: knMasteryEffectsSchema.optional(),
  // Fréquence d'utilisation, suivie par la fiche ; « une fois par cible » ou par arme reste du texte.
  limit: z.enum(KN_USE_LIMITS).optional(),
  self: knSelfEffectsSchema.optional(),
  // Modifie le test de Camp tant que l'aptitude est débloquée.
  campCheck: knCampCheckSchema.optional(),
  // Clé de la fiche de sbire (rôle `minion` du bestiaire) que l'aptitude invoque.
  summons: slug.optional(),
  // Ce que l'aptitude change à l'attaque du survivant.
  attack: knAbilityAttackSchema.optional(),
  text: z.string().trim().min(1).max(2000),
})

const knMasteryTextSchema = z.object({
  name: z.string().trim().min(1).max(100),
  text: z.string().trim().min(1).max(2000),
})

const knMasteryFeatureSchema = knMasteryTextSchema.extend({
  effects: knMasteryEffectsSchema.optional(),
  onCombatWon: knSelfEffectsSchema.optional(),
  campActivity: knCampActivitySchema.optional(),
})

export const KN_MASTERY_TRAINING_COUNT = 6

export const knMasterySchema = z.object({
  key: slug,
  name: z.string().trim().min(1).max(100),
  summary: z.string().trim().min(1).max(1000),
  feature: knMasteryFeatureSchema,
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
