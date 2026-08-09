import type { SubraceData } from '~/data/character-builder'

/**
 * Picker de sous-race PILOTÉ PAR LE CATALOGUE pour l'espèce « base + lignée » (chantier lignée,
 * D17 — lot 5b). Aujourd'hui l'Elfe seul est seedé en base+lignée : ce composable résout l'id de
 * l'Elfe base puis charge `/api/catalog/species/[id]` (loader `loadSpeciesLineages`, champs
 * d'affichage dérivés) et l'expose comme des `SubraceData` — la MÊME forme que le blob `RaceData`
 * hardcodé, si bien que `StepRace` et l'aperçu fonctionnent sans réécriture. Chaque sous-race
 * porte en plus son `lineageId` : la soumission envoie `speciesId = Elfe base` + `selectedLineageId`
 * (chemin serveur du lot 5a), au lieu de l'ancienne espèce séparée.
 *
 * Les autres espèces (non seedées en base+lignée) gardent le blob `RaceData` jusqu'au lot 6 →
 * `StepRace` fait un chemin double via le `subraces` de `useCharacterBuilder`.
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

export function useElfLineages() {
  // Réutilise le fetch d'espèces (dédupé par URL avec useBuilderEntities) pour résoudre l'Elfe base.
  const { data: species } = useFetch<{ id: number, name: string }[]>('/api/character_species', {
    default: () => [],
  })
  const elfBaseSpeciesId = computed(() =>
    species.value?.find(s => s.name.trim().toLowerCase() === 'elfe')?.id ?? null,
  )

  // Charge la structure riche dès que l'id de base est connu (immediate:false → pas d'appel à id=0).
  const { data: rich, refresh } = useFetch<CatalogSpeciesRich | null>(
    () => `/api/catalog/species/${elfBaseSpeciesId.value ?? 0}`,
    { default: () => null, immediate: false, watch: false },
  )
  watch(elfBaseSpeciesId, (id) => { if (id) refresh() }, { immediate: true })

  const elfLineageSubraces = computed<SubraceData[]>(() =>
    (rich.value?.lineages ?? []).map(l => ({
      id: String(l.id),
      name: l.name,
      dbName: null,
      abilityBonuses: l.abilityBonuses,
      speed: l.speed,
      darkvision: l.darkvision ?? undefined,
      description: l.description ?? '',
      traits: l.traits,
      lineageId: l.id,
    })),
  )

  return { elfBaseSpeciesId, elfLineageSubraces }
}
