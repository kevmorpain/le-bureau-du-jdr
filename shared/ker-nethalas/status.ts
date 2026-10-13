import { z } from 'zod'
import { KN_CONDITION_KEYS } from './catalog/conditions'
import { KN_MADNESS_COUNTER_KEYS, emptyKnMadness } from './catalog/madness'
import { KN_ROT_MAX_STAGE } from './catalog/rot'
import { knDiceSchema } from './diceSchema'
import { KN_TARGET_GROUPS, KN_VITAL_KEYS } from './effects'
import { KN_RESISTANCE_KEYS, KN_SKILL_KEYS } from './skills'
import { boundedInt, shapeOf } from './zodHelpers'

// Fréquences d'utilisation du livre (p. 123) : « par repos » vaut pour une pause comme pour un camp, « par camp » pour le
// camp seul ; « par combat » et « par pièce » se remettent à zéro à la fin du combat et à l'entrée dans une pièce, « par Domaine »
// quand on en commence un nouveau.
export const KN_USE_LIMITS = ['combat', 'room', 'rest', 'campRest', 'domain'] as const

export type KnUseLimit = (typeof KN_USE_LIMITS)[number]

export const KN_STATUS_BOUNDS = {
  conditionValue: { min: 0, max: 999 },
  counter: { min: 0, max: 99 },
  customAmount: { min: -99, max: 99 },
  conditions: 40,
  lostSkills: 30,
  custom: 20,
  customEntries: 20,
  sustained: 30,
  used: 30,
  temporary: { min: 0, max: 9999 },
} as const

const knSkill = z.enum(KN_SKILL_KEYS)
const knTarget = z.enum([...KN_SKILL_KEYS, ...KN_RESISTANCE_KEYS, ...KN_TARGET_GROUPS])
const knVital = z.enum(KN_VITAL_KEYS)

export const knConditionEntrySchema = z.object({
  key: z.enum(KN_CONDITION_KEYS),
  value: boundedInt(KN_STATUS_BOUNDS.conditionValue).optional(),
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
  // Effet posé par une action de créature : il disparaît à la fin du combat, perd un round à chaque round qui passe et
  // inflige `tick` au survivant au début de chaque tour.
  combat: z.boolean().optional(),
  rounds: boundedInt({ min: 1, max: 99 }).optional(),
  tick: z.object({ dice: knDiceSchema, direct: z.boolean().optional() }).optional(),
  // Salles restantes à parcourir avant que l'effet cesse (0 : il tient jusqu'à la sortie de la salle courante). Sans
  // `combat`, `rounds` ni `rooms`, un effet dure jusqu'à ce qu'on le retire.
  rooms: boundedInt({ min: 0, max: 99 }).optional(),
})

const knTemporaryAmount = boundedInt(KN_STATUS_BOUNDS.temporary)

// Points qui s'ajoutent au maximum, jusqu'à être dépensés ou jusqu'au prochain repos (p. 13).
export const knTemporarySchema = z.object({
  health: knTemporaryAmount.optional(),
  toughness: knTemporaryAmount.optional(),
  aether: knTemporaryAmount.optional(),
  sanity: knTemporaryAmount.optional(),
})

export type KnTemporary = z.infer<typeof knTemporarySchema>

export const knUsedAbilitySchema = z.object({
  key: z.string().regex(/^[a-z][a-zA-Z0-9]{0,39}:[1-5]$/),
  limit: z.enum(KN_USE_LIMITS),
})

export type KnUsedAbility = z.infer<typeof knUsedAbilitySchema>

export const knStatusSchema = z.object({
  conditions: z.array(knConditionEntrySchema).max(KN_STATUS_BOUNDS.conditions)
    .refine(list => new Set(list.map(c => c.key)).size === list.length, { message: 'Condition en double' }),
  rotStage: boundedInt({ min: 0, max: KN_ROT_MAX_STAGE }),
  madness: knMadnessSchema,
  custom: z.array(knCustomModifierSchema).max(KN_STATUS_BOUNDS.custom),
  // Aptitudes de Maîtrise Maintenues, actives (`<Maîtrise>:<palier>`) ; absent chez les survivants d'avant, donc optionnel.
  sustained: z.array(z.string().regex(/^[a-z][a-zA-Z0-9]{0,39}:[1-5]$/)).max(KN_STATUS_BOUNDS.sustained).optional(),
  // Aptitudes à usage limité déjà utilisées depuis la dernière remise à zéro de leur fréquence.
  used: z.array(knUsedAbilitySchema).max(KN_STATUS_BOUNDS.used).optional(),
  temporary: knTemporarySchema.optional(),
})

export type KnStatus = z.infer<typeof knStatusSchema>
export type KnConditionEntry = z.infer<typeof knConditionEntrySchema>
export type KnCustomEntry = z.infer<typeof knCustomEntrySchema>
export type KnCustomModifier = z.infer<typeof knCustomModifierSchema>

export const emptyKnStatus = (): KnStatus => ({
  conditions: [],
  rotStage: 0,
  madness: emptyKnMadness(),
  custom: [],
})
