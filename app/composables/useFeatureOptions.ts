export interface FeatureOptionDetail {
  id: number
  name: string
  description: string | null
}

// Le catalogue des progressions ne porte que les identifiants des options : leurs noms et descriptions viennent d'ici.
export function useFeatureOptions(ids: MaybeRefOrGetter<number[]>) {
  const { data } = useFetch<FeatureOptionDetail[]>('/api/catalog/feature-options', {
    query: { ids: computed(() => [...new Set(toValue(ids))].join(',')) },
    default: () => [],
    // Chaque composable qui lit le pacte ou les picks refait la même requête : une seule part, les autres attendent.
    dedupe: 'defer',
  })
  const details = computed(() => data.value ?? [])
  const byId = computed(() => new Map(details.value.map(o => [o.id, o])))
  const nameOf = (id: number | null | undefined): string | null => (id == null ? null : byId.value.get(id)?.name ?? null)
  return { details, byId, nameOf }
}
