import type { Effect } from '~~/server/db/schema/effects'
import type { FeaturePrerequisite } from '~~/server/db/schema/features'
import { ABILITY_KEYS, type AbilityKey } from '~~/shared/rules/abilities'

export interface Feat {
  id: number
  name: string
  description: string | null
  effects: Effect[]
  prerequisites?: FeaturePrerequisite | null
}

export type { AbilityKey }
const ALL_ABILITIES: AbilityKey[] = [...ABILITY_KEYS]

// Caractéristiques autorisées par un don à choix de carac. Absente/vide = n'importe laquelle (Résilient).
export function featAllowedAbilities(effects: Effect[] | undefined): AbilityKey[] {
  const eff = (effects ?? []).find(e => e.type === 'ability_increase_choice')
  const abilities = (eff?.value as { abilities?: AbilityKey[] } | undefined)?.abilities
  return abilities && abilities.length ? abilities : ALL_ABILITIES
}

export function useFeats() {
  // Pas de `key` fixe : l'auto-clé (URL + query) sépare les entrées de cache socle / étendu.
  const { extendedQuery } = useExtendedContent()
  const { data, refresh, pending } = useFetch<Feat[]>('/api/feats', {
    query: extendedQuery,
    default: () => [],
  })

  const feats = computed<Feat[]>(() => data.value ?? [])

  const byId = computed(() => new Map(feats.value.map(f => [f.id, f])))

  const getById = (id: number | null | undefined): Feat | null => {
    if (id == null) return null
    return byId.value.get(id) ?? null
  }

  return { feats, getById, pending, refresh }
}
