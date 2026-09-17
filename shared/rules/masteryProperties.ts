import { z } from 'zod'

export const MASTERY_PROPERTIES = ['cleave', 'graze', 'nick', 'push', 'sap', 'slow', 'topple', 'vex'] as const

export type MasteryProperty = (typeof MASTERY_PROPERTIES)[number]

export const masteryPropertyEnum = z.enum(MASTERY_PROPERTIES)
