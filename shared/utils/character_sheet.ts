import { z } from 'zod'
import { abilityEnum } from '~~/shared/rules/abilities'
import { ALIGNMENT_CODES } from '~~/shared/rules/alignments'
import { DEATH_SAVE_LIMIT } from '~~/shared/rules/damage'
import { currentHitDieSchema } from '~~/shared/rules/hitDice'
import { preferencesSchema } from '~~/shared/rules/preferences'
import { temporaryEffectsSchema } from '~~/shared/utils/temporary_effects'

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
  alignment: z.enum(ALIGNMENT_CODES).optional(),
  hpBase: z.number().int().min(0).optional(),
  currentHp: z.number().int().min(0).optional(),
  temporaryHp: z.number().int().min(0).optional(),
  // `null` : fiche antérieure à la colonne — le client renvoie la fiche telle quelle.
  currentHitDie: currentHitDieSchema.nullable().optional(),
  inspiration: z.boolean().optional(),
  exhaustionLevel: z.number().int().min(0).max(6).optional(),
  deathSaveSuccesses: z.number().int().min(0).max(DEATH_SAVE_LIMIT).optional(),
  deathSaveFailures: z.number().int().min(0).max(DEATH_SAVE_LIMIT).optional(),
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
  age: z.string().max(50).optional(),
  height: z.string().max(50).optional(),
  weight: z.string().max(50).optional(),
  eyes: z.string().max(50).optional(),
  hair: z.string().max(50).optional(),
  skin: z.string().max(50).optional(),
  deity: z.string().max(100).optional(),
  backstory: z.string().max(10000).optional(),
  allies: z.string().max(5000).optional(),
  // URL du portrait — '' = aucun. Le schéma n'impose pas `.url()` (une URL en cours
  // de frappe casserait l'auto-save) ; l'affichage ne rend que http(s) et les chemins
  // relatifs (cf. IdentitySection.vue).
  portraitUrl: z.string().max(2000).optional(),
  concentratingSpellId: z.number().int().positive().nullable().optional(),
  concentratingOn: z.string().trim().min(1).max(100).nullable().optional(),
  notes: z.string().max(5000).optional(),
  temporaryEffects: temporaryEffectsSchema.optional(),
  // `null` : la fiche hérite des défauts du compte — le client renvoie la fiche telle quelle.
  preferences: preferencesSchema.nullable().optional(),
})

export const setASISchema = z.object({
  improvements: z.array(z.object({
    classId: z.number().int().positive(),
    classLevel: z.number().int().min(1).max(20),
    ability: abilityEnum,
    amount: z.number().int().min(1).max(2),
  })),
})
