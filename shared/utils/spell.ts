import { z } from 'zod'
import { SpellComponent } from '~~/server/db/schema/spells'

export const spellSchema = z.object({
  name: z.string().min(1).max(100),
  level: z.number().min(0).max(9),
  schoolId: z.number().int(),
  castingTime: z.string().min(1).max(100),
  range: z.number().max(100),
  components: z.array(z.nativeEnum(SpellComponent)).min(1).max(3),
  material: z.string().max(255).optional(),
  duration: z.string().min(1).max(100),
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
})
