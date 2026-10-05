import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { useCharacterSheet } from '../../app/composables/useCharacterSheet'
import { barbareFeatures } from '../../server/db/seeds/data/barbare'
import { guerrierFeatures } from '../../server/db/seeds/data/guerrier'
import { moineFeatures } from '../../server/db/seeds/data/moine'
import { warlockFeatures } from '../../server/db/seeds/data/warlock'
import { abilityScores, classSheet, featureRow, named } from '../fixtures/classSheet'

// useCharacterSheet assemble les réserves, les traits et les effets « tant que la capacité est active » : les
// résistances de la Rage doivent rejoindre les défenses, les formules lire le niveau de LEUR classe.

let seq = 9400

const sheetWith = async (build: (id: number) => ReturnType<typeof classSheet>, inventory: unknown[] = []) => {
  const id = ++seq
  registerEndpoint(`/api/character_sheets/${id}/inventory`, () => inventory)
  registerEndpoint(`/api/character_sheets/${id}/proficiency-overrides`, () => [])
  registerEndpoint(`/api/character_sheets/${id}/spells`, () => [])
  registerEndpoint('/api/backgrounds', () => [])
  const cs = build(id)
  let s!: ReturnType<typeof useCharacterSheet>
  await mountSuspended(defineComponent({
    setup() {
      s = useCharacterSheet(toRef(() => cs) as never)
      return () => h('div')
    },
  }))
  return { cs, s }
}

const plate = (id: number) => ({
  id: 1,
  characterSheetId: id,
  itemId: 1,
  quantity: 1,
  equipped: true,
  attuned: false,
  magicBonus: 0,
  currentUses: 0,
  notes: null,
  usingTwoHanded: false,
  item: {
    id: 1,
    name: 'Harnois',
    itemType: 'armor',
    properties: { armor_type: 'heavy', base_ac: 18, dex_limit: 0, strength_requirement: 15, stealth_disadvantage: true },
    effects: [],
    maxUses: null,
    rechargeType: null,
    rechargeDice: null,
    isCustom: false,
    rarity: null,
    requiresAttunement: false,
    attunementNote: null,
  },
})

const defenseKeys = (s: ReturnType<typeof useCharacterSheet>) => s.defenseEntries.value.map(d => d.key).sort()

describe('fiche — Rage', () => {
  const barbarian = (id: number, active: boolean, level = 9) =>
    classSheet(id, 'Barbare', 1, level, [featureRow(named(barbareFeatures, 'Rage'), 1, { active })], { baseAbilityScores: abilityScores({ str: 16 }) })

  it('en rage : résistance contondant, perforant et tranchant dans les défenses', async () => {
    const { s } = await sheetWith(id => barbarian(id, true))
    expect(defenseKeys(s)).toEqual(['dmg:bludgeoning', 'dmg:piercing', 'dmg:slashing'])
  })

  it('hors rage : aucune résistance', async () => {
    const { s } = await sheetWith(id => barbarian(id, false))
    expect(defenseKeys(s)).toEqual([])
  })

  it('armure lourde : les résistances de la rage sont suspendues (« si vous ne portez pas d\'armure lourde »)', async () => {
    const { s } = await sheetWith(id => barbarian(id, true), [plate(9500)])
    await new Promise(r => setTimeout(r, 50))
    expect(s.wearsHeavyArmor.value).toBe(true)
    expect(defenseKeys(s)).toEqual([])
  })

  it('terminer la rage retire les résistances', async () => {
    const { cs, s } = await sheetWith(id => barbarian(id, true))
    cs.features[0].active = false
    expect(defenseKeys(s)).toEqual([])
  })

  it('niveau 20 : rages illimitées, plus de compteur', async () => {
    const { s } = await sheetWith(id => barbarian(id, false, 20))
    expect(s.resolvedFeatures.value[0]).toMatchObject({ maxUses: null, unlimited: true })
  })
})

describe('fiche — multiclasse', () => {
  it('Moine 5 (principal) / Barbare 3 : rages et ki sur le niveau de LEUR classe', async () => {
    const { s } = await sheetWith(id => classSheet(id, 'Moine', 2, 5, [
      featureRow(named(barbareFeatures, 'Rage'), 1),
      featureRow(named(moineFeatures, 'Ki'), 2),
    ], {
      classes: [
        { classId: 2, level: 5, isMain: true, class: { name: 'Moine' }, subclass: null },
        { classId: 1, level: 3, isMain: false, class: { name: 'Barbare' }, subclass: null },
      ],
    }))
    const byName = Object.fromEntries(s.resolvedFeatures.value.map(f => [f.name, f.maxUses]))
    expect(byName).toEqual({ Rage: 3, Ki: 5 })
    expect(Object.fromEntries(s.resourceGroups.value.map(g => [g.key, g.max]))).toEqual({ rage: 3, ki: 5 })
  })

  it('Paladin 8 (principal) / Occultiste 3 : Magie de pacte sur le niveau d\'occultiste — 2 emplacements de niveau 2', async () => {
    const { s } = await sheetWith(id => classSheet(id, 'Paladin', 8, 8, [
      featureRow(named(warlockFeatures, 'Magie de pacte'), 3),
    ], {
      classes: [
        { classId: 8, level: 8, isMain: true, class: { name: 'Paladin' }, subclass: null },
        { classId: 3, level: 3, isMain: false, class: { name: 'Occultiste', spellcastingAbility: 'cha' }, subclass: null },
      ],
    }))
    await vi.waitFor(() => expect(s.spellSlots.value.pact_magic[2]!.max).toBe(2))
    expect(s.spellSlots.value.pact_magic[4]!.max).toBe(0)
  })

  it('Guerrier 5 / Barbare 5 : 2 attaques, elles ne se cumulent pas', async () => {
    const { s } = await sheetWith(id => classSheet(id, 'Guerrier', 6, 5, [
      featureRow(named(guerrierFeatures, 'Attaque supplémentaire'), 6),
      featureRow(named(barbareFeatures, 'Attaque supplémentaire'), 1),
    ], {
      classes: [
        { classId: 6, level: 5, isMain: true, class: { name: 'Guerrier' }, subclass: null },
        { classId: 1, level: 5, isMain: false, class: { name: 'Barbare' }, subclass: null },
      ],
    }))
    expect(s.classTraits.value.attacksPerAction).toBe(2)
  })
})
