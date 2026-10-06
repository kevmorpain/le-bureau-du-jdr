import { z } from 'zod'
import { KN_CONDITION_KEYS } from './catalog/conditions'
import {
  KN_GROWING_DARKNESS_KEYS,
  type KnGrowingDarknessKey,
} from './catalog/growingDarkness'
import { KN_MADNESS_COUNTER_KEYS, emptyKnMadness } from './catalog/madness'
import { KN_ROT_MAX_STAGE } from './catalog/rot'
import { KN_OVERSEER_INFLUENCE_KEYS } from './catalog/overseerInfluence'
import { KN_TARGET_GROUPS, KN_VITAL_KEYS } from './effects'
import { KN_RESISTANCE_KEYS, KN_SKILL_KEYS } from './skills'
import { boundedInt, shapeOf } from './zodHelpers'

export const KN_STATUS_BOUNDS = {
  conditionValue: { min: 0, max: 999 },
  counter: { min: 0, max: 99 },
  growingDarknessValue: { min: 0, max: 99 },
  customAmount: { min: -99, max: 99 },
  conditions: 40,
  growingDarkness: 40,
  overseerInfluences: 40,
  lostSkills: 30,
  custom: 20,
  customEntries: 20,
} as const

const knSkill = z.enum(KN_SKILL_KEYS)
const knTarget = z.enum([...KN_SKILL_KEYS, ...KN_RESISTANCE_KEYS, ...KN_TARGET_GROUPS])
const knVital = z.enum(KN_VITAL_KEYS)

export const knConditionEntrySchema = z.object({
  key: z.enum(KN_CONDITION_KEYS),
  value: boundedInt(KN_STATUS_BOUNDS.conditionValue).optional(),
})

export const knGrowingDarknessEntrySchema = z.object({
  key: z.enum(KN_GROWING_DARKNESS_KEYS as [KnGrowingDarknessKey, ...KnGrowingDarknessKey[]]),
  value: boundedInt(KN_STATUS_BOUNDS.growingDarknessValue).optional(),
  skill: knSkill.optional(),
})

export const knMadnessSchema = z.object({
  counters: z.object(shapeOf(KN_MADNESS_COUNTER_KEYS, boundedInt(KN_STATUS_BOUNDS.counter))),
  lostSkills: z.array(z.object({ skill: knSkill.optional() })).max(KN_STATUS_BOUNDS.lostSkills),
})

export const knCustomEntrySchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('modifier'), target: knTarget, amount: boundedInt(KN_STATUS_BOUNDS.customAmount) }),
  z.object({ kind: z.literal('advantage'), target: knTarget }),
  z.object({ kind: z.literal('disadvantage'), target: knTarget }),
  z.object({ kind: z.literal('maxVital'), vital: knVital, amount: boundedInt(KN_STATUS_BOUNDS.customAmount) }),
])

export const knCustomModifierSchema = z.object({
  id: z.string().min(1).max(40),
  name: z.string().trim().min(1).max(100),
  active: z.boolean(),
  entries: z.array(knCustomEntrySchema).max(KN_STATUS_BOUNDS.customEntries),
  note: z.string().trim().max(500).optional(),
})

export const knStatusSchema = z.object({
  conditions: z.array(knConditionEntrySchema).max(KN_STATUS_BOUNDS.conditions)
    .refine(list => new Set(list.map(c => c.key)).size === list.length, { message: 'Condition en double' }),
  rotStage: boundedInt({ min: 0, max: KN_ROT_MAX_STAGE }),
  madness: knMadnessSchema,
  domain: z.object({
    overseerInfluences: z.array(z.enum(KN_OVERSEER_INFLUENCE_KEYS)).max(KN_STATUS_BOUNDS.overseerInfluences),
    growingDarkness: z.array(knGrowingDarknessEntrySchema).max(KN_STATUS_BOUNDS.growingDarkness),
  }),
  custom: z.array(knCustomModifierSchema).max(KN_STATUS_BOUNDS.custom),
})

export type KnStatus = z.infer<typeof knStatusSchema>
export type KnConditionEntry = z.infer<typeof knConditionEntrySchema>
export type KnGrowingDarknessEntry = z.infer<typeof knGrowingDarknessEntrySchema>
export type KnCustomEntry = z.infer<typeof knCustomEntrySchema>
export type KnCustomModifier = z.infer<typeof knCustomModifierSchema>

export const emptyKnStatus = (): KnStatus => ({
  conditions: [],
  rotStage: 0,
  madness: emptyKnMadness(),
  domain: { overseerInfluences: [], growingDarkness: [] },
  custom: [],
})
