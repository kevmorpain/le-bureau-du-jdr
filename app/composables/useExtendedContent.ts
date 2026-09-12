import { useStorage } from '@vueuse/core'

/**
 * Drapeau GLOBAL « contenu étendu » : inclut le contenu d'extension gaté (cf.
 * shared/rules/source.ts) dans les listes du catalogue. Persistant via `useStorage`
 * (localStorage, même pattern que l'état de rencontre) → mémorisé entre sessions et
 * partagé par toutes les surfaces (builder, navigateur de sorts…).
 *
 * `extendedQuery` est le fragment à passer à l'option `query` de `useFetch` : `{ extended: '1' }`
 * quand actif (le serveur lit `?extended=1`, cf. server/utils/catalogRequest.ts ; et l'URL
 * distincte donne une entrée de cache edge distincte), `{}` sinon — donc quand le drapeau est
 * inactif l'URL est INCHANGÉE et le cache/dedup existant est préservé. Réactif : basculer le
 * drapeau relance les `useFetch` qui l'incluent dans leur `query`.
 */
export function useExtendedContent() {
  const extended = useStorage('extended-content', false)
  const extendedQuery = computed(() => extended.value ? { extended: '1' } : {})
  return { extended, extendedQuery }
}
