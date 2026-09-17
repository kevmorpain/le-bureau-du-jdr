import type { MaybeRefOrGetter } from 'vue'
import type { SubraceData } from '~/data/character-builder'

/**
 * Picker de sous-race PILOTÉ PAR LE CATALOGUE pour les espèces « base + lignée » (D17) : expose les
 * lignées sous la MÊME forme que le blob `RaceData` (plus leur `lineageId`), si bien que `StepRace`
 * fonctionne sans réécriture. `baseName` est RÉACTIF ; `lineageSubraces` reste `[]` tant que la
 * structure chargée ne correspond pas à la base courante (évite un flash pendant le refetch).
 */

interface CatalogLineage {
  id: number
  name: string
  description: string | null
  abilityBonuses: Partial<Record<string, number>>
  speed: number
  darkvision: number | null
  traits: string[]
}
interface CatalogSpeciesRich {
  id: number
  name: string
  speed: number
  size: string
  lineages: CatalogLineage[]
}

export function useSpeciesLineages(baseName: MaybeRefOrGetter<string | null>) {
  const { extended, extendedQuery } = useExtendedContent()
  const { data: species } = useFetch<{ id: number, name: string }[]>('/api/character_species', {
    query: extendedQuery,
    default: () => [],
  })
  const baseSpeciesId = computed(() => {
    const n = toValue(baseName)?.trim().toLowerCase()
    if (!n) return null
    return species.value?.find(s => s.name.trim().toLowerCase() === n)?.id ?? null
  })

  // Charge la structure riche dès que l'id de base est connu (immediate:false → pas d'appel à id=0).
  const { data: rich, refresh } = useFetch<CatalogSpeciesRich | null>(
    () => `/api/catalog/species/${baseSpeciesId.value ?? 0}`,
    { query: extendedQuery, default: () => null, immediate: false, watch: false },
  )
  // Refetch quand la base OU le drapeau étendu change (les lignées gatées apparaissent/disparaissent).
  watch([baseSpeciesId, extended], ([id]) => { if (id) refresh() }, { immediate: true })

  const lineageSubraces = computed<SubraceData[]>(() => {
    // Ne rend les lignées que si la structure chargée correspond à la base courante (anti-flash).
    if (!rich.value || rich.value.id !== baseSpeciesId.value) return []
    return rich.value.lineages.map(l => ({
      id: String(l.id),
      name: l.name,
      dbName: null,
      abilityBonuses: l.abilityBonuses,
      speed: l.speed,
      darkvision: l.darkvision ?? undefined,
      description: l.description ?? '',
      traits: l.traits,
      lineageId: l.id,
    }))
  })

  return { baseSpeciesId, lineageSubraces }
}
