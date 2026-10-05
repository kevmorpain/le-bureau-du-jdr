import type { ClassSlug } from './classSlugs'

type RitualContext = {
  classSlug: ClassSlug | undefined
  isPrepared: boolean
  source: string | null | undefined
}

// Capacité « Rituel » : le barde (sort connu) et le magicien (sort du grimoire) n'ont pas à
// préparer le sort, le clerc et le druide si ; ensorceleur, rôdeur et roublard n'en ont pas. L'occultiste ne le peut que
// pour les sorts du Livre des Ombres et l'Appel de familier du pacte de la chaîne.
export function canCastAsRitual(spell: { ritual: boolean }, { classSlug, isPrepared, source }: RitualContext): boolean {
  if (!spell.ritual) return false
  if (source === 'book_of_ancient_secrets' || source === 'pact_chain') return true
  switch (classSlug) {
    case 'bard':
    case 'wizard':
      return true
    case 'cleric':
    case 'druid':
      return isPrepared
    default:
      return false
  }
}
