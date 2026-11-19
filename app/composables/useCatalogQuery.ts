import type { MaybeRefOrGetter } from 'vue'
import type { Ruleset } from '~~/shared/rules/ruleset'

/** Query du catalogue d'une édition : `ruleset` n'est envoyé que hors 2014, pour garder l'URL (et le cache edge) d'aujourd'hui. */
export function useCatalogQuery(ruleset: MaybeRefOrGetter<Ruleset>) {
  const { extendedQuery } = useExtendedContent()
  return computed(() => {
    const value = toValue(ruleset)
    return value === '5' ? extendedQuery.value : { ...extendedQuery.value, ruleset: value }
  })
}
