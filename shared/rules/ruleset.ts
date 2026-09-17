import { z } from 'zod'

// '5' = 2014 (DEFAULT de la colonne), '5.5' = 2024. Figé par personnage à la création (D2).
export const RULESETS = ['5', '5.5'] as const

export type Ruleset = (typeof RULESETS)[number]

export const rulesetEnum = z.enum(RULESETS)
