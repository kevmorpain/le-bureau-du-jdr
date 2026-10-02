import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import CombatModeSection from '../../app/components/character_sheet/CombatModeSection.vue'
import { barbareFeatures } from '../../server/db/seeds/data/barbare'
import { guerrierFeatures } from '../../server/db/seeds/data/guerrier'
import { paladinFeatures } from '../../server/db/seeds/data/paladin'
import { roublardFeatures } from '../../server/db/seeds/data/roublard'
import { abilityScores, classSheet, featureRow, named } from '../fixtures/classSheet'

const SHEET_ID = 9301

const weapon = (id: number, name: string, properties: string[], category: string, damageDice: string, damageType: string) => ({
  id,
  characterSheetId: SHEET_ID,
  itemId: id,
  quantity: 1,
  equipped: true,
  magicBonus: 0,
  currentUses: 0,
  notes: null,
  usingTwoHanded: false,
  attuned: false,
  item: {
    id,
    name,
    itemType: 'weapon',
    properties: { weapon_category: category, weapon_properties: properties, damage_dice: damageDice, damage_type: damageType, range: null },
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

registerEndpoint('/api/backgrounds', () => [])

const slotsOf = (levels: Record<number, number>) => ref({
  spellcasting: Object.fromEntries(Object.entries(levels).map(([l, n]) => [l, { max: n, current: n }])),
  pact_magic: {},
})

// `useFetch` met l'inventaire en cache par URL : une fiche (donc des endpoints) par montage.
let sheetSeq = SHEET_ID
const mount = async (characterSheet: ReturnType<typeof classSheet>, options: { weapons?: ReturnType<typeof weapon>[], slots?: ReturnType<typeof slotsOf>, roll?: ReturnType<typeof vi.fn> } = {}) => {
  characterSheet.id = ++sheetSeq
  registerEndpoint(`/api/character_sheets/${sheetSeq}/inventory`, () => options.weapons ?? [])
  registerEndpoint(`/api/character_sheets/${sheetSeq}/proficiency-overrides`, () => [])
  registerEndpoint(`/api/character_sheets/${sheetSeq}/spells`, () => [])
  const wrapper = await mountSuspended(CombatModeSection, {
    props: { characterSheet, roll: options.roll ?? vi.fn() },
    // UTooltip exige un UApp parent : sans objet ici, on le remplace par son contenu.
    global: { provide: { spellSlots: options.slots ?? slotsOf({}) }, stubs: { UTooltip: { template: '<div><slot /></div>' } } },
  })
  // L'inventaire est un `useFetch` du composant : on le laisse se résoudre avant d'inspecter.
  await new Promise(r => setTimeout(r, 50))
  return wrapper
}

const buttonWith = (wrapper: Awaited<ReturnType<typeof mount>>, text: string) =>
  wrapper.findAll('button').find(b => b.text().includes(text))

const rapier = () => weapon(1, 'Rapière', ['finesse'], 'martial_melee', '1d8', 'piercing')
const longsword = () => weapon(2, 'Épée longue', [], 'martial_melee', '1d8', 'slashing')
const greataxe = () => weapon(3, 'Hache à deux mains', ['heavy', 'two_handed'], 'martial_melee', '1d12', 'slashing')
const shortbow = () => weapon(4, 'Arc court', ['two_handed'], 'simple_ranged', '1d6', 'piercing')

describe('Mode combat — attaques par action', () => {
  it('Guerrier niveau 11 : 3 attaques par action Attaquer', async () => {
    const cs = classSheet(SHEET_ID, 'Guerrier', 6, 11, [featureRow(named(guerrierFeatures, 'Attaque supplémentaire'), 6)])
    const wrapper = await mount(cs)
    expect(wrapper.text()).toContain('3 attaques par action Attaquer')
  })

  it('Guerrier niveau 4 : pas de mention, une seule attaque', async () => {
    const cs = classSheet(SHEET_ID, 'Guerrier', 6, 4, [featureRow(named(guerrierFeatures, 'Attaque supplémentaire'), 6)])
    const wrapper = await mount(cs)
    expect(wrapper.text()).not.toContain('attaques par action')
  })
})

describe('Mode combat — Attaque sournoise', () => {
  const rogue = (level: number) => classSheet(SHEET_ID, 'Roublard', 9, level, [featureRow(named(roublardFeatures, 'Attaque sournoise'), 9)])

  it('propose les dés sur une arme à finesse, à hauteur du niveau (niveau 5 : 3d6)', async () => {
    const roll = vi.fn()
    const wrapper = await mount(rogue(5), { weapons: [rapier()], roll })
    const button = buttonWith(wrapper, 'Attaque sournoise')!
    expect(button.text()).toContain('3d6')

    await button.trigger('click')
    expect(roll).toHaveBeenCalledWith('Attaque sournoise — Rapière', 0, 6, 3)
  })

  it('propose les dés sur une arme à distance', async () => {
    const wrapper = await mount(rogue(1), { weapons: [shortbow()] })
    expect(buttonWith(wrapper, 'Attaque sournoise')!.text()).toContain('1d6')
  })

  it('ne les propose pas sur une arme sans finesse ni portée', async () => {
    const wrapper = await mount(rogue(5), { weapons: [longsword()] })
    expect(buttonWith(wrapper, 'Attaque sournoise')).toBeUndefined()
  })
})

describe('Mode combat — Rage', () => {
  const barbarian = (active: boolean, extra: Record<string, unknown> = {}) =>
    classSheet(SHEET_ID, 'Barbare', 1, 9, [featureRow(named(barbareFeatures, 'Rage'), 1, { active })], { baseAbilityScores: abilityScores({ str: 16 }), ...extra })

  it('en rage, +3 aux dégâts au niveau 9 (Force +3 compris) ; hors rage, +3 seulement', async () => {
    const raging = await mount(barbarian(true), { weapons: [greataxe()] })
    expect(buttonWith(raging, 'Dégâts 1d12')!.text()).toContain('1d12+6')

    const calm = await mount(barbarian(false), { weapons: [greataxe()] })
    expect(buttonWith(calm, 'Dégâts 1d12')!.text()).toContain('1d12+3')
  })

  it('le bonus ne vaut pas pour une arme à distance', async () => {
    const wrapper = await mount(barbarian(true, { baseAbilityScores: abilityScores({ str: 16, dex: 14 }) }), { weapons: [shortbow()] })
    expect(buttonWith(wrapper, 'Dégâts 1d6')!.text()).toContain('1d6+2')
  })

  it('arme à finesse : le bonus ne vaut que si l\'attaque utilise la Force', async () => {
    const strong = await mount(barbarian(true, { baseAbilityScores: abilityScores({ str: 16, dex: 14 }) }), { weapons: [rapier()] })
    expect(buttonWith(strong, 'Dégâts 1d8')!.text()).toContain('1d8+6')

    const nimble = await mount(barbarian(true, { baseAbilityScores: abilityScores({ str: 10, dex: 18 }) }), { weapons: [rapier()] })
    expect(buttonWith(nimble, 'Dégâts 1d8')!.text()).toContain('1d8+4')
  })

  it('l\'armure lourde suspend le bonus de rage', async () => {
    const plate = {
      id: 9,
      characterSheetId: SHEET_ID,
      itemId: 9,
      quantity: 1,
      equipped: true,
      magicBonus: 0,
      currentUses: 0,
      notes: null,
      usingTwoHanded: false,
      attuned: false,
      item: {
        id: 9,
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
    }
    const wrapper = await mount(barbarian(true), { weapons: [greataxe(), plate as never] })
    expect(buttonWith(wrapper, 'Dégâts 1d12')!.text()).toContain('1d12+3')
  })

  it('liste la Rage parmi les actions bonus avec ses utilisations restantes', async () => {
    const wrapper = await mount(barbarian(false))
    expect(wrapper.text()).toContain('Rage')
    expect(wrapper.text()).toContain('4 restants')
  })
})

describe('Mode combat — Châtiment divin', () => {
  const paladin = (level: number) => classSheet(SHEET_ID, 'Paladin', 8, level, [
    featureRow(named(paladinFeatures, 'Châtiment divin'), 8),
    featureRow(named(paladinFeatures, 'Châtiment divin amélioré'), 8),
  ])

  it('niveau 1 : 2d8 ; le dé supplémentaire s\'ajoute contre un mort-vivant ou un fiélon', async () => {
    const roll = vi.fn()
    const slots = slotsOf({ 1: 2, 2: 1 })
    const wrapper = await mount(paladin(11), { slots, roll })
    expect(buttonWith(wrapper, 'Niv. 1')!.text()).toContain('2d8')

    await buttonWith(wrapper, 'Niv. 1')!.trigger('click')
    expect(roll).toHaveBeenCalledWith('Châtiment divin (niv. 1)', 0, 8, 2)
    expect(slots.value.spellcasting[1]!.current).toBe(1)

    await wrapper.find('input[type="checkbox"], button[role="checkbox"]').trigger('click')
    expect(buttonWith(wrapper, 'Niv. 2')!.text()).toContain('4d8')
  })

  it('Châtiment divin amélioré (niveau 11) : +1d8 radiant à chaque coup de mêlée', async () => {
    const roll = vi.fn()
    const wrapper = await mount(paladin(11), { weapons: [longsword()], roll })
    const button = buttonWith(wrapper, 'Châtiment divin amélioré')!
    expect(button.text()).toContain('1d8')
    await button.trigger('click')
    expect(roll).toHaveBeenCalledWith('Châtiment divin amélioré — Épée longue', 0, 8, 1)
  })

  it('sans emplacement disponible, aucun niveau n\'est proposé', async () => {
    const wrapper = await mount(paladin(5), { slots: slotsOf({}) })
    expect(wrapper.text()).toContain('aucun emplacement disponible')
  })
})
