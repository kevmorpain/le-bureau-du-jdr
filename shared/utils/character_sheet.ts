import { z } from 'zod'

const classInputSchema = z.object({
  classId: z.number().int().positive(),
  level: z.number().int().min(1).max(20),
  isMain: z.boolean(),
  subclassId: z.number().int().positive().nullable().optional(),
})

export const createCharacterSheetSchema = z.object({
  name: z.string().min(1).max(100),
  speciesId: z.number().int().positive().optional(),
  classes: z.array(classInputSchema).optional(),
})

export const updateCharacterSheetSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  speciesId: z.number().int().positive().optional(),
  classes: z.array(classInputSchema).optional(),
  alignment: z.enum(['LG', 'NG', 'CG', 'LN', 'TN', 'CN', 'LE', 'NE', 'CE']).optional(),
  maxHp: z.number().int().min(0).optional(),
  currentHp: z.number().int().min(0).optional(),
  temporaryHp: z.number().int().min(0).optional(),
  inspiration: z.boolean().optional(),
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
  concentratingSpellId: z.number().int().positive().nullable().optional(),
})

export const setASISchema = z.object({
  improvements: z.array(z.object({
    classId: z.number().int().positive(),
    classLevel: z.number().int().min(1).max(20),
    ability: z.enum(['str', 'dex', 'con', 'int', 'wis', 'cha']),
    amount: z.number().int().min(1).max(2),
  })),
})
