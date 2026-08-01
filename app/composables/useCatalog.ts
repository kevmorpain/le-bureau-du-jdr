import { resolveChoices, type Catalog, type CharacterProjection, type ResolvedChoice } from '~~/shared/rules/resolve'

/**
 * Lecture du CATALOGUE de progression (lot 6b) — le front consomme `/api/catalog/progressions`
 * (endpoint statique/cachable du lot 6a) et exécute `resolveChoices` LOCALEMENT contre une
 * projection du perso (rules-engine.md §5 : catalogue cachable + projection dynamique).
 *
 * Aujourd'hui le catalogue ne porte que les points de choix SEEDÉS : ceux de l'Occultiste
 * (pacte / invocations / arcanums). Les choix des autres classes (style de combat, expertise,
 * sous-classe non-occultiste) ne sont pas encore en base (contenu Phase 2) et restent pilotés
 * par les tables de `app/data` — cf. useCharacterBuilder / useLevelUp.
 *
 * `useFetch` dédupe par URL : plusieurs appels (builder, level-up) partagent le même fetch.
 */
export function useCatalog() {
  const { data: catalog } = useFetch<Catalog>('/api/catalog/progressions', {
    default: () => ({ progressions: [] }),
  })

  /**
   * Les points de choix APPLICABLES à un perso mono-classe de `classId` (id DB) au niveau `level`.
   * `classId` null (classe non résolue / catalogue pas encore chargé) → aucun choix.
   */
  function choicesForClassLevel(classId: number | null | undefined, level: number): ResolvedChoice[] {
    if (!classId) return []
    const projection: CharacterProjection = { classLevels: { [classId]: level } }
    return resolveChoices(projection, catalog.value).choices
  }

  return { catalog, choicesForClassLevel }
}
