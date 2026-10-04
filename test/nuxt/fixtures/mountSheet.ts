import { defineComponent, h, ref } from 'vue'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { expect, vi } from 'vitest'
import type { Effect } from '../../../server/db/schema/effects'
import { useCharacterSheet } from '../../../app/composables/useCharacterSheet'

export const inventoryEntry = (
  sheetId: number,
  id: number,
  name: string,
  itemType: 'armor' | 'weapon' | 'equipment',
  properties: Record<string, unknown>,
  effects: Effect[] = [],
  state: { attuned?: boolean, requiresAttunement?: boolean } = {},
) => ({
  id,
  characterSheetId: sheetId,
  itemId: id,
  quantity: 1,
  equipped: true,
  attuned: state.attuned ?? false,
  magicBonus: 0,
  currentUses: 0,
  notes: null,
  usingTwoHanded: false,
  item: {
    id, name, itemType, properties, description: null, effects, maxUses: null, rechargeType: null,
    rechargeDice: null, isCustom: false, rarity: null, requiresAttunement: state.requiresAttunement ?? false, attunementNote: null,
  },
})

export const classFeature = (id: number, name: string, classId: number, levelRequired: number, effects: Effect[], featureType = 'class_feature') => ({
  featureId: id,
  currentUses: 0,
  active: false,
  feature: {
    id, name, featureType, classId, subclassId: null, levelRequired, maxUsesFormula: null,
    rechargeType: null, meta: null, featureEffects: effects.map(effect => ({ effect })),
  },
})

export const baseScores = (str: number, dex: number, con: number, wis: number) => [
  { abilityId: 'str', value: str }, { abilityId: 'dex', value: dex }, { abilityId: 'con', value: con },
  { abilityId: 'int', value: 10 }, { abilityId: 'wis', value: wis }, { abilityId: 'cha', value: 10 },
]

export interface SheetScenario {
  scores: ReturnType<typeof baseScores>
  classes?: { classId: number, level: number }[]
  features?: ReturnType<typeof classFeature>[]
  speciesEffects?: Effect[]
  temporaryEffects?: { id: number, name: string, active: boolean, effects: Effect[] }[]
  worn?: (sheetId: number) => ReturnType<typeof inventoryEntry>[]
}

// Un identifiant de fiche par scénario : useFetch met l'inventaire en cache par URL.
let nextSheetId = 9200

export const mountSheet = async (scenario: SheetScenario) => {
  const id = nextSheetId++
  const inventory = scenario.worn?.(id) ?? []
  registerEndpoint(`/api/character_sheets/${id}/inventory`, () => inventory)
  registerEndpoint(`/api/character_sheets/${id}/proficiency-overrides`, () => [])
  registerEndpoint(`/api/character_sheets/${id}/spells`, () => [])
  registerEndpoint('/api/backgrounds', () => [])

  const sheet = ref({
    id,
    baseAbilityScores: scenario.scores,
    classes: (scenario.classes ?? []).map(c => ({ ...c, isMain: true, class: { id: c.classId, name: 'Classe' }, subclass: null })),
    features: scenario.features ?? [],
    skills: [],
    abilityScoreImprovements: [],
    species: {
      name: 'Espèce',
      speed: 9,
      speciesFeatures: [{ feature: { featureType: 'species_trait', featureEffects: (scenario.speciesEffects ?? []).map(effect => ({ effect })) } }],
    },
    temporaryEffects: scenario.temporaryEffects ?? [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)

  let s!: ReturnType<typeof useCharacterSheet>
  await mountSuspended(defineComponent({
    setup() {
      s = useCharacterSheet(sheet)
      return () => h('div')
    },
  }))
  if (inventory.length) await vi.waitFor(() => expect(s.inventory.value).toHaveLength(inventory.length))
  return s
}
