import { toValue, type MaybeRefOrGetter } from 'vue'

// Sous-ressource `/api/character_sheets/<id>/<resource>` : rien n'est demandé tant que la fiche n'a pas d'id (un
// `useFetch` sur une URL nulle part quand même), et la clé, par fiche et par ressource, est partagée par tous les
// composables qui la lisent.
export function useSheetResource<T>(sheetId: MaybeRefOrGetter<number | null | undefined>, resource: string, fallback: () => T) {
  const requestFetch = useRequestFetch()
  return useAsyncData(
    () => `sheet-${toValue(sheetId) ?? 'none'}-${resource}`,
    (): Promise<T> => {
      const id = toValue(sheetId)
      return id == null ? Promise.resolve(fallback()) : requestFetch<T>(`/api/character_sheets/${id}/${resource}`)
    },
    { default: fallback },
  )
}
