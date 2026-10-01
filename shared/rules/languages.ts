// Langues du PHB 2014, libellés d'AideDD (Historiques › Langues). Clé machine = valeur des effets
// `language_proficiency` et des choix `language`. Les langues secrètes (druidique, jargon des voleurs)
// ne se choisissent qu'avec l'accord du MD : elles restent hors des listes de choix.

export const STANDARD_LANGUAGES = {
  common: 'Commun',
  elvish: 'Elfique',
  giant: 'Géant',
  dwarvish: 'Nain',
  gnomish: 'Gnome',
  goblin: 'Gobelin',
  halfling: 'Halfelin',
  orcish: 'Orc',
} as const

export const EXOTIC_LANGUAGES = {
  abyssal: 'Abyssal',
  celestial: 'Céleste',
  undercommon: 'Commun des profondeurs',
  draconic: 'Draconique',
  infernal: 'Infernal',
  primordial: 'Primordial',
  deep_speech: 'Profond',
  sylvan: 'Sylvestre',
} as const

export const LANGUAGE_LABELS: Record<string, string> = { ...STANDARD_LANGUAGES, ...EXOTIC_LANGUAGES }

export const LANGUAGE_KEYS: string[] = Object.keys(LANGUAGE_LABELS)

// Les maîtrises manuelles antérieures stockent parfois le libellé plutôt que la clé : affichées telles quelles.
export const languageLabel = (value: string): string => LANGUAGE_LABELS[value] ?? value
