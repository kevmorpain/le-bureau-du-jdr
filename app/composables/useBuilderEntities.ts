/**
 * Fetch et cache des entités DB nécessaires au builder (classes/sous-classes,
 * espèces, backgrounds, items). Sert d'unique point de résolution
 * « slug/name → dbId », ce qui permet au reste du builder de ne manipuler
 * que des IDs côté payload, sans WHERE name lookup côté serveur.
 */
type DbClass = { id: number, name: string, subclasses: Array<{ id: number, name: string }> }
type DbSpecies = { id: number, name: string }
type DbBackground = { id: number, name: string }
type DbItem = { id: number, name: string }

export function useBuilderEntities() {
  const { data: classes } = useFetch<DbClass[]>('/api/classes', {
    default: () => [],
  })
  const { data: species } = useFetch<DbSpecies[]>('/api/character_species', {
    default: () => [],
  })
  const { data: backgrounds } = useFetch<DbBackground[]>('/api/backgrounds', {
    default: () => [],
  })
  const { data: items } = useFetch<DbItem[]>('/api/items', {
    default: () => [],
  })

  // ── Résolution name → id ───────────────────────────────────────────────────
  // Strict (exact, case-insensitive) : renvoie null si pas trouvé pour exposer
  // tôt les divergences au lieu de les laisser silencieuses côté serveur.

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
  }
}
