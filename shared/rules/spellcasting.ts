// `none` : les sous-classes lanceuses (Chevalier occulte, Filou ésotérique) sont portées par la sous-classe.
export const SPELLCASTING_TYPES = ['full', 'half', 'pact', 'none'] as const

export type SpellcastingType = (typeof SPELLCASTING_TYPES)[number]

export type CasterType = Exclude<SpellcastingType, 'none'>
