// `none` : une classe qui n'incante pas par elle-même (Guerrier, Roublard). Ses sous-classes lanceuses de sorts du
// tiers (`third`) sont décrites dans `subclassCasting.ts`.
export const SPELLCASTING_TYPES = ['full', 'half', 'third', 'pact', 'none'] as const

export type SpellcastingType = (typeof SPELLCASTING_TYPES)[number]

export type CasterType = Exclude<SpellcastingType, 'none'>
