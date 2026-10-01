import { describe, it, expect, vi, beforeAll } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import type { Effect } from '../../server/db/schema/effects'
import { useCharacterSheet } from '../../app/composables/useCharacterSheet'

// Bonus fixes de CA et de JS, portés par un objet (Anneau de protection, AideDD : « +1 à la CA et aux
// jets de sauvegarde », lien requis) ou par un effet temporaire de la fiche. Passe par useCharacterSheet
// pour garder le câblage objets + effets temporaires → CA, JS, initiative.

const SHEET_ID = 9103

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
    properties: { category: 'Bijou' },
    description: null,
    effects,
    maxUses: null,
    rechargeType: null,
    rechargeDice: null,
    isCustom: true,
    rarity: 'rare',
    requiresAttunement: state.requiresAttunement,
    attunementNote: null,
  },
})

const protection: Effect[] = [
  { type: 'armor_class_bonus', value: { amount: 1 } },
  { type: 'saving_throw_bonus', value: { ability: 'all', amount: 1 } },
]

registerEndpoint(`/api/character_sheets/${SHEET_ID}/inventory`, () => [
  entry(1, 'Anneau de protection', protection, { equipped: true, attuned: true, requiresAttunement: true }),
  entry(2, 'Cape de protection', protection, { equipped: true, attuned: false, requiresAttunement: true }),
  entry(3, 'Talisman de vigilance', [{ type: 'initiative_bonus', value: { amount: 2 } }], { equipped: true, attuned: false, requiresAttunement: false }),
])
registerEndpoint(`/api/character_sheets/${SHEET_ID}/proficiency-overrides`, () => [])
registerEndpoint(`/api/character_sheets/${SHEET_ID}/spells`, () => [])
registerEndpoint('/api/backgrounds', () => [])

const sheet = ref({
  id: SHEET_ID,
  baseAbilityScores: [
    { abilityId: 'str', value: 10 },
    { abilityId: 'dex', value: 14 },
    { abilityId: 'con', value: 10 },
    { abilityId: 'int', value: 10 },
    { abilityId: 'wis', value: 12 },
    { abilityId: 'cha', value: 10 },
  ],
  classes: [],
  features: [],
  skills: [{ skillKey: 'wis_save', proficiencyLevel: 'proficient' }],
  abilityScoreImprovements: [],
  species: null,
  temporaryEffects: [
    { id: 1, name: 'Bénédiction d\'Ilmater', active: true, effects: [{ type: 'saving_throw_bonus', value: { ability: 'all', amount: 1 } }] },
    { id: 2, name: 'Malédiction', active: true, effects: [{ type: 'armor_class_bonus', value: { amount: -2 } }] },
    { id: 3, name: 'Bouclier de la foi', active: false, effects: [{ type: 'armor_class_bonus', value: { amount: 2 } }] },
  ],
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

describe('fiche — bonus de CA et de JS', () => {
  it('CA sans armure : 10 + DEX +2, anneau lié +1, malédiction -2 ; cape non liée et effet inactif ignorés', async () => {
    await vi.waitFor(() => expect(s.inventory.value).toHaveLength(3))
    expect(s.armorClass.value.total).toBe(11)
    expect(s.armorClass.value.detail).toBe('10 + DEX +2 + Anneau de protection +1 + Malédiction -2')
  })

  it('JS : anneau +1 et bénédiction +1 sur chaque caractéristique, en plus de la maîtrise', async () => {
    await vi.waitFor(() => expect(s.inventory.value).toHaveLength(3))
    expect(s.savingThrows.value.str!.modifier).toBe(2) // 0 + 1 + 1
    expect(s.savingThrows.value.wis!.modifier).toBe(1 + s.proficiencyBonus.value + 2) // SAG +1, maîtrisé, +1 +1
    expect(s.savingThrowBonuses.value.dex).toEqual([
      { label: 'Anneau de protection', amount: 1 },
      { label: 'Bénédiction d\'Ilmater', amount: 1 },
    ])
  })

  it('un bonus d\'initiative d\'objet s\'applique (n\'était lu que sur les dons)', async () => {
    await vi.waitFor(() => expect(s.inventory.value).toHaveLength(3))
    expect(s.initiativeBonus.value).toBe(4) // DEX +2 + talisman +2
  })

  it('activer un effet temporaire le répercute sur la CA, le retirer l\'efface', async () => {
    await vi.waitFor(() => expect(s.inventory.value).toHaveLength(3))
    s.toggleTemporaryEffect(3)
    expect(sheet.value.temporaryEffects.find((t: { id: number }) => t.id === 3).active).toBe(true)
    expect(s.armorClass.value.total).toBe(13)

    s.removeTemporaryEffect(2)
    expect(s.armorClass.value.total).toBe(15)
    expect(s.armorClass.value.detail).toBe('10 + DEX +2 + Anneau de protection +1 + Bouclier de la foi +2')
  })

  it('un nouvel effet reçoit l\'identifiant suivant, une édition remplace en place', () => {
    s.saveTemporaryEffect({ name: 'Résistance au feu', active: true, effects: [{ type: 'damage_resistance', value: { damageType: 'fire' } }] })
    const created = sheet.value.temporaryEffects.at(-1)
    expect(created.id).toBe(4)
    expect(s.defenseEntries.value.some(d => d.key === 'dmg:fire' && d.level === 'resistance')).toBe(true)

    s.saveTemporaryEffect({ ...created, name: 'Résistance au froid', effects: [{ type: 'damage_resistance', value: { damageType: 'cold' } }] })
    expect(sheet.value.temporaryEffects.filter((t: { id: number }) => t.id === 4)).toHaveLength(1)
    expect(s.defenseEntries.value.some(d => d.key === 'dmg:fire')).toBe(false)
  })
})
