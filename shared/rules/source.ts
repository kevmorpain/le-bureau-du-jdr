import { z } from 'zod'

// Axe de VISIBILITÉ, orthogonal à `ruleset` : `core` (DEFAULT) toujours visible, extensions et homebrew
// gatés par défaut. Les entrées non-SRD antérieures à ce discriminant restent volontairement `core`.
export const SOURCES = ['core', 'tasha', 'xanathar', 'fizban', 'wbtw', 'strixhaven', 'homebrew'] as const

export type Source = (typeof SOURCES)[number]

export const sourceEnum = z.enum(SOURCES)

export const CORE_SOURCE = 'core' satisfies Source

export function isGatedSource(source: Source): boolean {
  return source !== CORE_SOURCE
}
