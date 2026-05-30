import type { Effect } from '~~/server/db/schema/effects'

export interface Feat {
  id: number
  name: string
  description: string | null
  effects: Effect[]
}

export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
const ALL_ABILITIES: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

// Caractéristiques autorisées par un don à choix de carac. La liste vient de
// l'effet `ability_increase_choice.value.abilities` (ex : Observateur → INT/SAG,
// Athlète → FOR/DEX). Absente/vide = n'importe quelle caractéristique (Résilient).
export function featAllowedAbilities(effects: Effect[] | undefined): AbilityKey[] {
  const eff = (effects ?? []).find(e => e.type === 'ability_increase_choice')
  const abilities = (eff?.value as { abilities?: AbilityKey[] } | undefined)?.abilities
  return abilities && abilities.length ? abilities : ALL_ABILITIES
}

// Charge la liste complète des dons (features feature_type='feat') une seule
// fois et la cache via useFetch — partagée entre StepAsi (builder), StepFeats
// (builder), LevelUpStepAsi, et la section Dons de la fiche perso.
export function useFeats() {
  const { data, refresh, pending } = useFetch<Feat[]>('/api/feats', {
    key: 'feats-list',
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
