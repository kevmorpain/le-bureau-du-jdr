import { z } from 'zod'
import type { DamageTypeKey } from '~~/server/db/schema/effects'
import { abilityEnum as ability } from '~~/shared/rules/abilities'
import { WEAPON_BONUS_SCOPES } from '~~/shared/rules/effectBonuses'
import { damageTypeLabels } from '~~/shared/utils/labels'

const damageType = z.enum(Object.keys(damageTypeLabels) as [DamageTypeKey, ...DamageTypeKey[]])
const signedBonus = z.number().int().min(-10).max(10)
// Champ numérique vidé dans l'éditeur → '' : vaut absence.
const optionalNumber = (schema: z.ZodNumber) =>
  z.preprocess(v => (v === '' || v === null ? undefined : v), schema.optional())

// Seuls les types que la fiche applique réellement : un type proposé mais jamais lu serait un effet mort.
const temporaryEffectEntrySchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('armor_class_bonus'), value: z.object({ amount: signedBonus }) }),
  z.object({ type: z.literal('saving_throw_bonus'), value: z.object({ ability: ability.or(z.literal('all')), amount: signedBonus }) }),
  z.object({ type: z.literal('weapon_attack_bonus'), value: z.object({ amount: signedBonus, weapons: z.enum(WEAPON_BONUS_SCOPES) }) }),
  z.object({ type: z.literal('weapon_damage_bonus'), value: z.object({ amount: signedBonus, weapons: z.enum(WEAPON_BONUS_SCOPES) }) }),
  z.object({ type: z.literal('ability_increase'), value: z.object({ ability, amount: z.number().int().min(1).max(10), max: optionalNumber(z.number().int().min(1).max(30)) }) }),
  z.object({ type: z.literal('ability_score_set'), value: z.object({ ability, score: z.number().int().min(1).max(30) }) }),
  z.object({ type: z.literal('damage_resistance'), value: z.object({ damageType }) }),
  z.object({ type: z.literal('damage_immunity'), value: z.object({ damageType }) }),
  z.object({ type: z.literal('vulnerability'), value: z.object({ damageType }) }),
  z.object({ type: z.literal('spell_save_dc_bonus'), value: z.object({ amount: signedBonus }) }),
  z.object({ type: z.literal('spell_attack_bonus'), value: z.object({ amount: signedBonus }) }),
  z.object({ type: z.literal('spell_damage_bonus'), value: z.object({ amount: signedBonus }) }),
  z.object({ type: z.literal('initiative_bonus'), value: z.object({ amount: signedBonus }) }),
  z.object({ type: z.literal('passive_skill_bonus'), value: z.object({ skill: z.enum(['perception', 'investigation']), amount: signedBonus }) }),
])

export const TEMPORARY_EFFECT_TYPES = temporaryEffectEntrySchema.options.map(o => o.shape.type.value)

export const temporaryEffectSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1).max(100),
  active: z.boolean(),
  // Texte libre pour ce que la fiche ne sait pas chiffrer (« ne peut répondre que par oui ou par non »).
  description: z.string().trim().max(1000).optional().transform(v => v || undefined),
  // Vide permis : l'entrée peut n'être qu'un nom et une description.
  effects: z.array(temporaryEffectEntrySchema).max(20),
})

export type TemporaryEffect = z.infer<typeof temporaryEffectSchema>

export const temporaryEffectsSchema = z.array(temporaryEffectSchema).max(50)
