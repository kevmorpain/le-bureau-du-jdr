import { z } from 'zod'
import { SpellComponent } from '~~/server/db/schema/spells'
import { COUNTED_DURATION_UNITS, durationText, SPELL_DURATION_UNITS } from '~~/shared/rules/durations'

const isCounted = (unit: string) => (COUNTED_DURATION_UNITS as readonly string[]).includes(unit)

export const spellSchema = z.object({
  name: z.string().min(1).max(100),
  level: z.number().min(0).max(9),
  schoolId: z.number().int(),
  castingTime: z.string().min(1).max(100),
  range: z.number().max(100),
  components: z.array(z.nativeEnum(SpellComponent)).min(1).max(3),
  material: z.string().max(255).optional(),
  durationUnit: z.enum(SPELL_DURATION_UNITS),
  durationValue: z.number().int().min(1).max(999).nullish(),
  // Texte libre : lu pour l'unité `special` seulement ; sinon le serveur le dérive de la durée structurée.
  duration: z.string().max(100).optional(),
  ritual: z.boolean(),
  concentration: z.boolean(),
  description: z.string().min(1),
}).refine((val) => {
  if (val.components.includes(SpellComponent.Material)) {
    return val.material !== undefined && val.material.trim().length > 0
  }

  return true
}, {
  message: 'zodI18n.errors.missing_material_component',
}).refine(val => !isCounted(val.durationUnit) || !!val.durationValue, {
  message: 'zodI18n.errors.missing_duration_value',
  path: ['durationValue'],
}).refine(val => val.durationUnit !== 'special' || !!val.duration?.trim(), {
  message: 'zodI18n.errors.missing_duration_text',
  path: ['duration'],
}).refine(val => !val.concentration || val.durationUnit !== 'instant', {
  message: 'zodI18n.errors.concentration_instant',
  path: ['concentration'],
}).transform(({ durationValue, duration, ...val }) => {
  const value = isCounted(val.durationUnit) ? durationValue ?? null : null
  return {
    ...val,
    durationValue: value,
    duration: durationText({ durationUnit: val.durationUnit, durationValue: value }, val.concentration, duration),
  }
})
