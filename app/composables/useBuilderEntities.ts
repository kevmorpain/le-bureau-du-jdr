// Unique point de résolution « slug/name → dbId » : le reste du builder ne manipule que des ids.
export type DbSubclass = { id: number, name: string, description?: string | null }
export type DbClass = { id: number, name: string, subclassLevel: number, subclasses: DbSubclass[] }
type DbSpecies = { id: number, name: string }
type DbBackground = { id: number, name: string }
type DbItem = { id: number, name: string }

export function useBuilderEntities() {
  const { extendedQuery } = useExtendedContent()
  const { data: classes } = useFetch<DbClass[]>('/api/catalog/classes', {
    query: extendedQuery,
    default: () => [],
  })
  const { data: species } = useFetch<DbSpecies[]>('/api/character_species', {
    query: extendedQuery,
    default: () => [],
  })
  const { data: backgrounds } = useFetch<DbBackground[]>('/api/backgrounds', {
    query: extendedQuery,
    default: () => [],
  })
  // `/api/items` n'a pas (encore) de filtre `source` côté serveur → pas de query extended ici.
  const { data: items } = useFetch<DbItem[]>('/api/items', {
    default: () => [],
  })

  // Résolution stricte (exacte, insensible à la casse) : `null` si absent, pour exposer tôt les divergences.

  const norm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase()

  function resolveClassId(dbName: string | null | undefined): number | null {
    if (!dbName) return null
    return classes.value?.find(c => norm(c.name) === norm(dbName))?.id ?? null
  }

  function resolveSubclassId(classDbName: string | null | undefined, subclassDbName: string | null | undefined): number | null {
    if (!classDbName || !subclassDbName) return null
    const cls = classes.value?.find(c => norm(c.name) === norm(classDbName))
    return cls?.subclasses.find(s => norm(s.name) === norm(subclassDbName))?.id ?? null
  }

  function resolveSpeciesId(dbName: string | null | undefined): number | null {
    if (!dbName) return null
    return species.value?.find(s => norm(s.name) === norm(dbName))?.id ?? null
  }

  function resolveBackgroundId(dbName: string | null | undefined): number | null {
    if (!dbName) return null
    return backgrounds.value?.find(b => norm(b.name) === norm(dbName))?.id ?? null
  }

  // ── Identité de sous-classe (catalogue) ─────────────────────────────────────

  function subclassCatalogFor(classDbId: number | null | undefined): { subclassLevel: number, subclasses: DbSubclass[] } | null {
    if (classDbId == null) return null
    const cls = classes.value?.find(c => c.id === classDbId)
    return cls ? { subclassLevel: cls.subclassLevel, subclasses: cls.subclasses } : null
  }

  function resolveItemIds(itemNames: string[]): { ids: number[], unresolved: string[] } {
    if (!itemNames.length || !items.value?.length) return { ids: [], unresolved: itemNames }
    const map = new Map<string, number>()
    for (const it of items.value) map.set(norm(it.name), it.id)
    const ids: number[] = []
    const unresolved: string[] = []
    for (const name of itemNames) {
      const id = map.get(norm(name))
      if (id != null) ids.push(id)
      else unresolved.push(name)
    }
    return { ids, unresolved }
  }

  return {
    classes,
    species,
    backgrounds,
    items,
    resolveClassId,
    resolveSubclassId,
    resolveSpeciesId,
    resolveBackgroundId,
    resolveItemIds,
    subclassCatalogFor,
  }
}
