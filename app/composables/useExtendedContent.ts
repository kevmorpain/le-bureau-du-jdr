import { useStorage } from '@vueuse/core'

/**
 * Drapeau GLOBAL « contenu étendu » (persistant via localStorage). `extendedQuery` vaut
 * `{ extended: '1' }` quand il est actif — URL distincte, donc entrée de cache edge distincte — et
 * `{}` sinon, ce qui laisse l'URL INCHANGÉE et préserve le cache existant.
 */
export function useExtendedContent() {
  const extended = useStorage('extended-content', false)
  const extendedQuery = computed(() => extended.value ? { extended: '1' } : {})
  return { extended, extendedQuery }
}
