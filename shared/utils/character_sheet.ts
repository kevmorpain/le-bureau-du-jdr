import { z } from 'zod'

const classInputSchema = z.object({
  classId: z.number().int().positive(),
  level: z.number().int().min(1).max(20),
  isMain: z.boolean(),
  spellcastingAbility: z.string().nullable().optional(),
})

export const createCharacterSheetSchema = z.object({
  name: z.string().min(1).max(100),
  speciesId: z.number().int().positive().optional(),
  classes: z.array(classInputSchema).optional(),
})

export const updateCharacterSheetSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  speciesId: z.number().int().positive().nullable().optional(),
  classes: z.array(classInputSchema).optional(),
  exhaustionLevel: z.number().int().min(0).max(6).optional(),
  dragonbornAncestry: z.string().nullable().optional(),
  pp: z.number().int().min(0).optional(),
  po: z.number().int().min(0).optional(),
  pe: z.number().int().min(0).optional(),
  pa: z.number().int().min(0).optional(),
  pc: z.number().int().min(0).optional(),
  personalityTraits: z.string().max(2000).optional(),
  ideals: z.string().max(1000).optional(),
  bonds: z.string().max(1000).optional(),
  flaws: z.string().max(1000).optional(),
})
