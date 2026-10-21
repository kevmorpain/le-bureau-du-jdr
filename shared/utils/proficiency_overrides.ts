import { z } from 'zod'
import { abilityEnum } from '~~/shared/rules/abilities'
import { skillEnum } from '~~/shared/rules/skills'

// Maîtrises posées sur la fiche hors des règles dérivées : ajouts et retraits manuels, et ce que le catalogue ne
// modélise pas (compétence et langue de l'Humain variant).
export const PROFICIENCY_OVERRIDE_TYPES = ['weapon', 'armor', 'language', 'tool', 'skill', 'saving_throw'] as const
export const PROFICIENCY_OVERRIDE_ACTIONS = ['grant', 'revoke', 'expertise'] as const

export type ProficiencyOverrideType = (typeof PROFICIENCY_OVERRIDE_TYPES)[number]
export type ProficiencyOverrideAction = (typeof PROFICIENCY_OVERRIDE_ACTIONS)[number]

const grantOrRevoke = z.enum(['grant', 'revoke'])
const withExpertise = z.enum(PROFICIENCY_OVERRIDE_ACTIONS)

export const proficiencyOverrideSchema = z.discriminatedUnion('proficiencyType', [
  z.object({ proficiencyType: z.literal('skill'), value: skillEnum, action: withExpertise }),
  z.object({ proficiencyType: z.literal('saving_throw'), value: abilityEnum, action: withExpertise }),
  z.object({ proficiencyType: z.enum(['weapon', 'armor', 'language', 'tool']), value: z.string().min(1).max(100), action: grantOrRevoke }),
])

export const proficiencyOverrideDeleteSchema = z.object({
  proficiencyType: z.enum(PROFICIENCY_OVERRIDE_TYPES),
  value: z.string().min(1).max(100),
})
