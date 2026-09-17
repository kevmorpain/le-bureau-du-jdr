import { z } from 'zod'

export const FEATURE_TAGS = ['invocation', 'metamagic', 'maneuver', 'fighting_style', 'pact_boon'] as const

export type FeatureTag = (typeof FEATURE_TAGS)[number]

export const featureTagEnum = z.enum(FEATURE_TAGS)
