const ARCANUM_SOURCES = ['arcanum_6', 'arcanum_7', 'arcanum_8', 'arcanum_9'] as const
type ArcanumSource = typeof ARCANUM_SOURCES[number]

const arcanumLevelOf = (source: string | null | undefined): number | null =>
  source && (ARCANUM_SOURCES as readonly string[]).includes(source) ? Number((source as ArcanumSource).split('_')[1]) : null

const LABELS: Record<string, string> = {
  pact_chain: 'Pacte · Chaîne',
  pact_tome: 'Pacte · Tome',
  invocation: 'Manifestation',
  book_of_ancient_secrets: 'Livre des Ombres',
  feat: 'Don',
  species: 'Espèce',
}

const TOOLTIPS: Record<string, string> = {
  pact_chain: 'Sort octroyé par le Pacte de la Chaîne',
  pact_tome: 'Sort mineur du Pacte du Tome',
  invocation: 'Sort octroyé par une manifestation occulte',
  feat: 'Sort octroyé par un don',
  species: 'Sort inné octroyé par un trait de votre espèce',
  book_of_ancient_secrets: 'Sort rituel inscrit dans votre Livre des Ombres (lançable uniquement en tant que rituel).',
}

export const spellSourceLabel = (source: string | null | undefined): string => {
  const arcanum = arcanumLevelOf(source)
  if (arcanum) return `Arcanum (niv. ${arcanum}) — 1/repos long`
  return (source && LABELS[source]) || ''
}

export const spellSourceTooltip = (source: string | null | undefined): string => {
  const arcanum = arcanumLevelOf(source)
  if (arcanum) return `Arcane Mystérieux (niv. ${arcanum}) — peut être lancé 1 fois par repos long sans dépenser d'emplacement de sort.`
  return (source && TOOLTIPS[source]) || ''
}
