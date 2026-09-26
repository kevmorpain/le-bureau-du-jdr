import { describe, it, expect, vi, beforeAll } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import type { Effect } from '../../server/db/schema/effects'
import { useCharacterSheet } from '../../app/composables/useCharacterSheet'

// Les effets de caractéristique des objets n'atteignaient pas les scores de la fiche (seule la couche
// d'incantation les recevait), et un objet exigeant un lien agissait sans lien. Ce test passe par
// useCharacterSheet pour garder le câblage inventaire → caractéristiques.

const SHEET_ID = 9102

const entry = (id: number, name: string, effects: Effect[], state: { equipped: boolean, attuned: boolean, requiresAttunement: boolean }) => ({
  id,
  characterSheetId: SHEET_ID,
  itemId: id,
  quantity: 1,
  equipped: state.equipped,
  attuned: state.attuned,
  magicBonus: 0,
  currentUses: 0,
  notes: null,
  usingTwoHanded: false,
  item: {
    id,
    name,
    itemType: 'equipment',
    properties: { category: 'wondrous' },
    description: null,
    effects,
    maxUses: null,
    rechargeType: null,
    rechargeDice: null,
    isCustom: true,
    rarity: 'uncommon',
    requiresAttunement: state.requiresAttunement,
    attunementNote: null,
  },
})

registerEndpoint(`/api/character_sheets/${SHEET_ID}/inventory`, () => [
  entry(1, 'Gantelets de puissance d\'ogre', [{ type: 'ability_score_set', value: { ability: 'str', score: 19 } }], { equipped: true, attuned: true, requiresAttunement: true }),
  entry(2, 'Pierre de Ioun (vigueur)', [
    { type: 'ability_increase', value: { ability: 'con', amount: 2, max: 20 } },
    { type: 'spell_save_dc_bonus', value: { amount: 1 } },
  ], { equipped: true, attuned: false, requiresAttunement: true }),
  entry(3, 'Anneau rangé au sac', [{ type: 'ability_increase', value: { ability: 'dex', amount: 2 } }], { equipped: false, attuned: false, requiresAttunement: false }),
  entry(4, 'Amulette d\'étude', [{ type: 'ability_increase', value: { ability: 'int', amount: 2, max: 20 } }], { equipped: true, attuned: false, requiresAttunement: false }),
])
registerEndpoint(`/api/character_sheets/${SHEET_ID}/proficiency-overrides`, () => [])
registerEndpoint(`/api/character_sheets/${SHEET_ID}/spells`, () => [])
registerEndpoint('/api/backgrounds', () => [])

const sheet = ref({
  id: SHEET_ID,
  baseAbilityScores: [
    { abilityId: 'str', value: 15 },
    { abilityId: 'dex', value: 12 },
    { abilityId: 'con', value: 14 },
    { abilityId: 'int', value: 10 },
    { abilityId: 'wis', value: 10 },
    { abilityId: 'cha', value: 10 },
  ],
  classes: [],
  features: [],
  skills: [],
  abilityScoreImprovements: [],
  species: null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any)

let s: ReturnType<typeof useCharacterSheet>

beforeAll(async () => {
  await mountSuspended(defineComponent({
    setup() {
      s = useCharacterSheet(sheet)
      return () => h('div')
    },
  }))
})

describe('fiche — effets de caractéristique des objets', () => {
  it('applique un score fixé par un objet équipé et lié (FOR 15 → 19)', async () => {
    await vi.waitFor(() => expect(s.abilityScores.value.str!.total).toBe(19))
    expect(s.abilityScores.value.str!.items).toBe(4)
    expect(s.abilityModifiers.value.str).toBe(4)
  })

  it('applique le bonus d\'un objet équipé qui n\'exige pas de lien (INT 10 → 12)', async () => {
    await vi.waitFor(() => expect(s.abilityScores.value.int!.total).toBe(12))
  })

  it('ignore un objet non équipé (DEX reste 12)', async () => {
    await vi.waitFor(() => expect(s.inventory.value).toHaveLength(4))
    expect(s.abilityScores.value.dex!.total).toBe(12)
  })

  it('ignore TOUS les effets d\'un objet qui exige un lien sans être lié', async () => {
    await vi.waitFor(() => expect(s.inventory.value).toHaveLength(4))
    expect(s.abilityScores.value.con!.total).toBe(14)
    expect(s.allEffects.value.some(e => e.type === 'spell_save_dc_bonus')).toBe(false)
  })
})
