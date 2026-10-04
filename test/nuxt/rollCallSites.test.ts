import { describe, it, expect, vi } from 'vitest'
import { nextTick, reactive, ref } from 'vue'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import AbilityScoresSection from '../../app/components/character_sheet/AbilityScoresSection.vue'
import CombatModeSection from '../../app/components/character_sheet/CombatModeSection.vue'
import HitPointsSection from '../../app/components/character_sheet/HitPointsSection.vue'
import { barbareFeatures } from '../../server/db/seeds/data/barbare'
import { roublardFeatures } from '../../server/db/seeds/data/roublard'
import { rollEngineKey, idlePending } from '../../app/composables/character/useCharacterRolls'
import { classSheet, featureRow, named } from '../fixtures/classSheet'

// Les sites d'appel du lanceur de dés : chacun doit dire de quel jet il s'agit (attaque, caractéristique, sauvegarde,
// dégâts liés à une attaque) pour que la fiche y applique avantages, relances et critiques.

registerEndpoint('/api/backgrounds', () => [])

let sheetSeq = 9400

const weapon = (id: number, name: string, properties: string[], category: string, damageDice: string, sheetId: number) => ({
  id,
  characterSheetId: sheetId,
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
    properties: { weapon_category: category, weapon_properties: properties, damage_dice: damageDice, damage_type: 'slashing', range: null },
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

const mountCombat = async (
  weapons: (sheetId: number) => ReturnType<typeof weapon>[],
  options: {
    roll?: ReturnType<typeof vi.fn>
    species?: unknown
    storage?: Record<string, unknown>
    features?: ReturnType<typeof featureRow>[]
    attackMode?: 'advantage' | 'disadvantage' | 'normal'
  } = {},
) => {
  const id = ++sheetSeq
  const inventory = weapons(id)
  registerEndpoint(`/api/character_sheets/${id}/inventory`, () => inventory)
  registerEndpoint(`/api/character_sheets/${id}/proficiency-overrides`, () => [])
  registerEndpoint(`/api/character_sheets/${id}/spells`, () => [])
  for (const [suffix, value] of Object.entries(options.storage ?? {})) localStorage.setItem(`char:${id}:${suffix}`, JSON.stringify(value))
  registerEndpoint(`/api/character_sheets/${id}/features`, { method: 'PUT', handler: () => ({}) })
  const characterSheet = classSheet(id, 'Guerrier', 6, 5, options.features ?? [], options.species ? { species: options.species } : {})
  const engine = options.attackMode ? { pending: ref({ ...idlePending(), attackMode: options.attackMode }) } : null
  const roll = options.roll ?? vi.fn()
  const wrapper = await mountSuspended(CombatModeSection, {
    props: { characterSheet, roll },
    global: { provide: { spellSlots: ref({ spellcasting: {}, pact_magic: {} }), ...(engine ? { [rollEngineKey as symbol]: engine } : {}) }, stubs: { UTooltip: { template: '<div><slot /></div>' } } },
  })
  await new Promise(r => setTimeout(r, 50))
  return { wrapper, roll, characterSheet }
}

const buttonWith = (wrapper: Awaited<ReturnType<typeof mountCombat>>['wrapper'], text: string) =>
  wrapper.findAll('button').find(b => b.text().includes(text))

describe('Mode combat — jets de l\'arme', () => {
  const longsword = (id: number) => weapon(1, 'Épée longue', [], 'martial_melee', '1d8', id)
  const shortbow = (id: number) => weapon(2, 'Arc court', ['two_handed'], 'simple_ranged', '1d6', id)
  const greataxe = (id: number) => weapon(3, 'Hache à deux mains', ['heavy', 'two_handed'], 'martial_melee', '1d12', id)

  it('l\'attaque est un jet d\'attaque d\'arme', async () => {
    const { wrapper, roll } = await mountCombat(id => [longsword(id)])
    await buttonWith(wrapper, 'Attaque +')!.trigger('click')
    expect(roll).toHaveBeenCalledWith('Attaque — Épée longue', expect.any(Number), 20, 1, { d20: { type: 'attack', weapon: true, strengthMelee: true, extra: [] } })
  })

  it('arme lourde en Petite taille : le désavantage de l\'arme accompagne le jet', async () => {
    const { wrapper, roll } = await mountCombat(id => [greataxe(id)], { species: { name: 'Halfelin', size: 'S', speed: 7.5, speciesFeatures: [] } })
    await buttonWith(wrapper, 'Attaque')!.trigger('click')
    expect(roll).toHaveBeenCalledWith('Attaque — Hache à deux mains', expect.any(Number), 20, 1, {
      d20: { type: 'attack', weapon: true, strengthMelee: true, extra: [{ label: 'Arme lourde + Petite taille', mode: 'disadvantage' }] },
    })
  })

  it('les dégâts d\'une arme de mêlée portent le dé de l\'arme en mêlée, ceux d\'une arme à distance non', async () => {
    const melee = await mountCombat(id => [longsword(id)])
    await buttonWith(melee.wrapper, 'Dégâts')!.trigger('click')
    expect(melee.roll).toHaveBeenCalledWith('Dégâts — Épée longue', expect.any(Number), 8, 1, { damage: { weaponDie: { melee: true } } })

    const ranged = await mountCombat(id => [shortbow(id)])
    await buttonWith(ranged.wrapper, 'Dégâts')!.trigger('click')
    expect(ranged.roll).toHaveBeenCalledWith('Dégâts — Arc court', expect.any(Number), 6, 1, { damage: { weaponDie: { melee: false } } })
  })
})

describe('Mode combat — Attaque sournoise et avantage', () => {
  const rapier = (id: number) => weapon(5, 'Rapière', ['finesse'], 'martial_melee', '1d8', id)
  const sneak = () => [featureRow(named(roublardFeatures, 'Attaque sournoise'), 6)]
  const sneakButton = async (attackMode?: 'advantage' | 'disadvantage' | 'normal') => {
    const { wrapper } = await mountCombat(id => [rapier(id)], { features: sneak(), attackMode })
    return buttonWith(wrapper, 'Attaque sournoise')!
  }

  it('avantage au dernier jet d\'attaque : les dés sont signalés comme permis', async () => {
    expect((await sneakButton('advantage')).text()).toContain('✓')
  })

  it('désavantage au dernier jet d\'attaque : les dés sont signalés comme refusés', async () => {
    expect((await sneakButton('disadvantage')).text()).toContain('✗')
  })

  it('ni l\'un ni l\'autre, ou aucun jet : à confirmer (ennemi adjacent)', async () => {
    expect((await sneakButton('normal')).text()).toContain('?')
    expect((await sneakButton()).text()).toContain('?')
  })
})

describe('Mode combat — Attaque téméraire', () => {
  const reckless = (active: boolean) => [featureRow(named(barbareFeatures, 'Attaque téméraire'), 6, { active })]

  it('s\'active comme la Rage, et « Nouveau tour » y met fin', async () => {
    const { wrapper, characterSheet } = await mountCombat(() => [], { features: reckless(true) })
    expect(buttonWith(wrapper, 'Mettre fin')).toBeDefined()
    expect(characterSheet.features[0].active).toBe(true)

    await buttonWith(wrapper, 'Nouveau tour')!.trigger('click')
    await new Promise(r => setTimeout(r, 50))
    expect(characterSheet.features[0].active).toBe(false)
  })

  it('« Nouveau tour » laisse en l\'état une capacité qui ne se termine pas d\'elle-même', async () => {
    const rage = [featureRow(named(barbareFeatures, 'Rage'), 6, { active: true })]
    const { wrapper, characterSheet } = await mountCombat(() => [], { features: rage })
    await buttonWith(wrapper, 'Nouveau tour')!.trigger('click')
    await new Promise(r => setTimeout(r, 50))
    expect(characterSheet.features[0].active).toBe(true)
  })

  it('inactive, elle propose de s\'activer', async () => {
    const { wrapper } = await mountCombat(() => [], { features: reckless(false) })
    expect(buttonWith(wrapper, 'Activer')).toBeDefined()
  })
})

describe('Mode combat — initiative et rounds', () => {
  it('affiche l\'initiative obtenue et le round, que « Nouveau tour » fait avancer', async () => {
    const { wrapper } = await mountCombat(() => [], { storage: { initiative: { total: 17, natural: 14 } } })
    expect(wrapper.text()).toContain('Initiative 17')
    expect(wrapper.text()).toContain('Round 1')

    await buttonWith(wrapper, 'Nouveau tour')!.trigger('click')
    await nextTick()
    expect(wrapper.text()).toContain('Round 2')

    await wrapper.find('button[aria-label="Round précédent"]').trigger('click')
    await nextTick()
    expect(wrapper.text()).toContain('Round 1')
    expect(wrapper.find('button[aria-label="Round précédent"]').attributes('disabled')).toBeDefined()
  })

  it('sans jet d\'initiative, rien n\'est affiché', async () => {
    const { wrapper } = await mountCombat(() => [])
    expect(wrapper.text()).not.toContain('Initiative')
  })
})

describe('AbilityScoresSection — type des jets', () => {
  const sheet = () => reactive({
    id: ++sheetSeq,
    baseAbilityScores: [{ abilityId: 'str', value: 14 }, { abilityId: 'dex', value: 10 }, { abilityId: 'con', value: 10 }, { abilityId: 'int', value: 10 }, { abilityId: 'wis', value: 10 }, { abilityId: 'cha', value: 10 }],
    classes: [{ classId: 1, level: 1 }],
    features: [],
    skills: [],
    abilityScoreImprovements: [],
    species: null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any) as any

  const mountAbilities = async () => {
    const s = sheet()
    registerEndpoint(`/api/character_sheets/${s.id}/inventory`, () => [])
    registerEndpoint(`/api/character_sheets/${s.id}/proficiency-overrides`, () => [])
    registerEndpoint(`/api/character_sheets/${s.id}/spells`, () => [])
    const roll = vi.fn()
    const wrapper = await mountSuspended(AbilityScoresSection, { props: { characterSheet: s, roll } })
    return { wrapper, roll }
  }

  it('la pastille de la caractéristique lance un jet de caractéristique, avec le modificateur du jet', async () => {
    const { wrapper, roll } = await mountAbilities()
    await wrapper.find('li button').trigger('click')
    expect(roll).toHaveBeenCalledWith(expect.any(String), 2, 20, 1, { d20: { type: 'check', ability: 'str' } })
  })

  it('« Sauvegarde » lance un jet de sauvegarde de la caractéristique', async () => {
    const { wrapper, roll } = await mountAbilities()
    await wrapper.findAll('li')[0]!.findAll('span').find(s => s.text() === 'Sauvegarde')!.trigger('click')
    expect(roll).toHaveBeenCalledWith(expect.any(String), 2, 20, 1, { d20: { type: 'save', ability: 'str' } })
  })

  it('une compétence lance un jet de caractéristique qui nomme la compétence', async () => {
    const { wrapper, roll } = await mountAbilities()
    await wrapper.findAll('li')[0]!.findAll('span.cursor-pointer.truncate')[0]!.trigger('click')
    expect(roll).toHaveBeenCalledWith(expect.any(String), 2, 20, 1, { d20: { type: 'check', ability: 'str', skill: 'athletics' } })
  })
})

describe('HitPointsSection — Esquive instinctive', () => {
  const sheet = (withDodge: boolean) => reactive({
    id: ++sheetSeq,
    hpBase: 20,
    currentHp: 20,
    temporaryHp: 0,
    exhaustionLevel: 0,
    deathSaveSuccesses: 0,
    deathSaveFailures: 0,
    concentratingSpellId: null,
    concentratingOn: null,
    baseAbilityScores: [],
    classes: [{ classId: 1, level: 5 }],
    features: withDodge
      ? [{
          featureId: 1,
          currentUses: 0,
          active: false,
          feature: { id: 1, name: 'Esquive instinctive', featureType: 'class_feature', classId: 1, subclassId: null, levelRequired: 5, maxUsesFormula: null, rechargeType: null, meta: null, featureEffects: [{ effect: { type: 'halve_damage_reaction', value: {} } }] },
        }]
      : [],
    skills: [],
    abilityScoreImprovements: [],
    species: null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any) as any

  const mountHp = async (withDodge: boolean) => {
    const s = sheet(withDodge)
    registerEndpoint(`/api/character_sheets/${s.id}/inventory`, () => [])
    registerEndpoint(`/api/character_sheets/${s.id}/proficiency-overrides`, () => [])
    registerEndpoint(`/api/character_sheets/${s.id}/spells`, () => [])
    const wrapper = await mountSuspended(HitPointsSection, { props: { characterSheet: s } })
    await wrapper.findAll('button').find(b => b.text().includes('Dégâts'))!.trigger('click')
    return { s, wrapper }
  }

  it('la réaction divise les dégâts par deux (arrondi inférieur)', async () => {
    const { s, wrapper } = await mountHp(true)
    await wrapper.find('button[role="checkbox"]').trigger('click')
    await wrapper.find('input[placeholder="Dégâts bruts"]').setValue('9')
    await wrapper.findAll('button').find(b => b.text() === 'OK')!.trigger('click')
    expect(s.currentHp).toBe(16)
  })

  it('sans la capacité, aucune case n\'est proposée', async () => {
    const { wrapper } = await mountHp(false)
    expect(wrapper.find('button[role="checkbox"]').exists()).toBe(false)
  })
})
