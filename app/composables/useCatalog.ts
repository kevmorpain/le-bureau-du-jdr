import { resolveChoices, type Catalog, type CharacterProjection, type ResolvedChoice } from '~~/shared/rules/resolve'

// Le front lit le catalogue cachable (`/api/catalog/progressions`) puis exécute `resolveChoices`
// LOCALEMENT contre une projection du perso. Seuls les points de choix seedés y figurent.
export function useCatalog() {
  const { extendedQuery } = useExtendedContent()
  const { data: catalog } = useFetch<Catalog>('/api/catalog/progressions', {
    query: extendedQuery,
    default: () => ({ progressions: [] }),
  })

  /** `classId` null (classe non résolue / catalogue pas encore chargé) → aucun choix. */
  function choicesForClassLevel(classId: number | null | undefined, level: number): ResolvedChoice[] {
    if (!classId) return []
    const projection: CharacterProjection = { classLevels: { [classId]: level } }
    return resolveChoices(projection, catalog.value).choices
  }

  return { catalog, choicesForClassLevel }
}
