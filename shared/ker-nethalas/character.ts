import { z } from 'zod'
import {
  KN_RESISTANCE_KEYS,
  KN_SKILL_KEYS,
  KN_SKILL_STARTING_SCORES,
  type KnResistanceKey,
  type KnSkillKey,
} from './skills'
import { knProvisionsSchema } from './camp'
import { knRunSchema } from './run'
import { knStatusSchema } from './status'
import { boundedInt, shapeOf } from './zodHelpers'

export const KN_BOUNDS = {
  // Pas de plafond naturel ici : les objets magiques et les bonus circonstanciels dépassent 80.
  skill: { min: 0, max: 999 },
  // Plafond absolu, quel que soit l'équipement.
  resistance: { min: 0, max: 80 },
  vital: { min: 0, max: 9999 },
  level: { min: 1, max: 99 },
  xp: { min: 0, max: 999999 },
  exhaustion: { min: 0, max: 99 },
  damageModifier: { min: -99, max: 99 },
  extraSkills: 5,
} as const

export const knSkillSchema = z.object({
  score: boundedInt(KN_BOUNDS.skill),
  marked: z.boolean(),
})

export const knSkillsSchema = z.object(shapeOf(KN_SKILL_KEYS, knSkillSchema))

export const knExtraSkillSchema = knSkillSchema.extend({
  name: z.string().trim().min(1).max(50),
})

export const knResistancesSchema = z.object(shapeOf(KN_RESISTANCE_KEYS, boundedInt(KN_BOUNDS.resistance)))

export type KnSkills = z.infer<typeof knSkillsSchema>
export type KnExtraSkill = z.infer<typeof knExtraSkillSchema>
export type KnResistances = z.infer<typeof knResistancesSchema>

const name = z.string().trim().min(1).max(100)
const vital = boundedInt(KN_BOUNDS.vital)

export const createKnCharacterSchema = z.object({ name })

export const updateKnCharacterSchema = z.object({
  name,
  level: boundedInt(KN_BOUNDS.level),
  xp: boundedInt(KN_BOUNDS.xp),
  personalGoals: z.string().max(2000),
  healthCurrent: vital,
  healthMax: vital,
  toughnessCurrent: vital,
  toughnessMax: vital,
  aetherCurrent: vital,
  aetherMax: vital,
  sanityCurrent: vital,
  sanityMax: vital,
  exhaustion: boundedInt(KN_BOUNDS.exhaustion),
  damageModifier: boundedInt(KN_BOUNDS.damageModifier),
  resistances: knResistancesSchema,
  skills: knSkillsSchema,
  extraSkills: z.array(knExtraSkillSchema).max(KN_BOUNDS.extraSkills),
  status: knStatusSchema,
  run: knRunSchema,
  provisions: knProvisionsSchema,
  masteries: z.string().max(10000),
  perks: z.string().max(5000),
  weapons: z.string().max(5000),
  damageAffinities: z.string().max(5000),
  equipment: z.string().max(10000),
  notes: z.string().max(10000),
}).partial()

export type CreateKnCharacterInput = z.infer<typeof createKnCharacterSchema>
export type UpdateKnCharacterInput = z.infer<typeof updateKnCharacterSchema>

export const defaultKnSkills = (): KnSkills =>
  Object.fromEntries(
    KN_SKILL_KEYS.map(key => [key, { score: KN_SKILL_STARTING_SCORES[key], marked: false }]),
  ) as Record<KnSkillKey, { score: number, marked: boolean }>

// Départ : 20 partout, puis +20 sur une Résistance au choix du joueur.
export const defaultKnResistances = (): KnResistances =>
  Object.fromEntries(KN_RESISTANCE_KEYS.map(key => [key, 20])) as Record<KnResistanceKey, number>
