import type { MaybeRefOrGetter } from 'vue'
import type { SubraceData } from '~/data/character-builder'

/**
 * Picker de sous-race PILOTÉ PAR LE CATALOGUE pour les espèces « base + lignée » (chantier lignée,
 * D17 — généralisé au lot 6 ; ex-`useElfLineages`, elfe-only). Résout l'id de l'espèce de base par
 * son `baseName` (Elfe, Nain, Halfelin, Gnome, Tieffelin, Drakéide), charge
 * `/api/catalog/species/[id]` (loader `loadSpeciesLineages`, champs d'affichage dérivés) et l'expose
 * comme des `SubraceData` — la MÊME forme que le blob `RaceData` hardcodé, si bien que `StepRace` et
 * l'aperçu fonctionnent sans réécriture. Chaque sous-race porte en plus son `lineageId` : la
 * soumission envoie `speciesId = base` + `selectedLineageId` (chemin serveur du lot 5a).
 *
 * `baseName` est RÉACTIF (getter/ref) : quand la race change, l'id de base et la structure riche se
 * ré-résolvent. `lineageSubraces` reste `[]` tant que la structure chargée ne correspond pas à la
 * base courante (évite un flash des lignées de l'espèce précédente pendant le refetch).
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
  // Réutilise le fetch d'espèces (dédupé par URL avec useBuilderEntities) pour résoudre la base.
  const { data: species } = useFetch<{ id: number, name: string }[]>('/api/character_species', {
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
    { default: () => null, immediate: false, watch: false },
  )
  watch(baseSpeciesId, (id) => { if (id) refresh() }, { immediate: true })

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
