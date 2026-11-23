import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { readBody } from 'h3'
import { clearNuxtData, useState } from '#app'
import NewSheetPage from '../../app/pages/characters/[id]/nouvelle.vue'
import { spells } from '../../server/db/seeds/data/spells'
import { itemsData } from '../../server/db/seeds/data/items'
import { guerrierFeatures } from '../../server/db/seeds/data/guerrier'
import { abilityScores, featureRow, named } from '../fixtures/classSheet'
import { inventoryEntry } from './fixtures/mountSheet'

// The auth middleware would redirect to the login page and drop the sheet id from the route.
mockNuxtImport('navigateTo', () => vi.fn())

const SHEET_ID = 9402
const URL = `/api/character_sheets/${SHEET_ID}`
const FIGHTER_ID = 3

const characterSpell = (name: string, spellId: number) => ({
  characterSheetId: SHEET_ID,
  spellId,
  classId: null,
  isKnown: true,
  isPrepared: true,
  alwaysPrepared: false,
  source: null,
  spell: { ...spells.find(spell => spell.name === name)!, id: spellId, school: { name: 'Evocation' } },
})

const dagger = itemsData.find(item => item.name === 'Dague' && item.itemType === 'weapon')!

const secondWind = featureRow(named(guerrierFeatures, 'Second souffle'), FIGHTER_ID)

const buildSheet = () => ({
  id: SHEET_ID,
  name: 'Brannoc',
  ruleset: '5',
  updatedAt: '2026-11-23T10:00:00.000Z',
  hpBase: 40,
  currentHp: 40,
  temporaryHp: 0,
  exhaustionLevel: 0,
  deathSaveSuccesses: 0,
  deathSaveFailures: 0,
  concentratingSpellId: null,
  concentratingOn: null,
  baseAbilityScores: abilityScores({ str: 16, dex: 14 }),
  classes: [{ classId: FIGHTER_ID, level: 5, isMain: true, class: { name: 'Guerrier', hitDice: '1d10' }, subclass: null }],
  features: [{ ...secondWind, currentUses: 0 }],
  spellSlots: [{ slotType: 'spellcasting', slotLevel: 3, total: 1, used: 0, created: 0 }],
  proficiencyOverrides: [],
  abilityScoreImprovements: [],
  temporaryEffects: [],
  species: null,
  preferences: null,
  owner: { id: 1, name: 'PM', preferences: null },
})

const featurePuts: unknown[] = []

registerEndpoint(URL, () => buildSheet())
registerEndpoint(URL, { method: 'PUT', handler: async event => readBody(event) })
registerEndpoint(`${URL}/spells`, () => [
  characterSpell('Boule de feu', 801),
  characterSpell('Décharge occulte', 802),
  characterSpell('Maléfice', 803),
])
registerEndpoint(`${URL}/inventory`, () => [
  inventoryEntry(SHEET_ID, 1, 'Dague', 'weapon', dagger.properties as unknown as Record<string, unknown>),
])
registerEndpoint(`${URL}/features`, {
  method: 'PUT',
  handler: async (event) => {
    featurePuts.push(await readBody(event))
    return { ok: true }
  },
})
registerEndpoint(`${URL}/spell-slots`, { method: 'PUT', handler: async event => readBody(event) })
for (const part of ['backgrounds', 'spell_slots']) registerEndpoint(`${URL}/${part}`, () => [])
registerEndpoint('/api/items', () => [])

beforeEach(() => {
  clearNuxtData()
  featurePuts.length = 0
  useState('dice-toasts').value = []
})

const mountPlay = async () => {
  const wrapper = await mountSuspended(NewSheetPage, { route: `/characters/${SHEET_ID}/nouvelle` })
  await flushPromises()
  return wrapper
}

const getCardNames = (wrapper: VueWrapper) => wrapper.findAll('.play-card__name').map(name => name.text())
const findCard = (wrapper: VueWrapper, name: string) => wrapper.findAll('button.play-card').find(card => card.text().includes(name))!
const findButton = (scope: VueWrapper | ReturnType<VueWrapper['get']>, label: string) =>
  scope.findAll('button').find(button => button.text().startsWith(label))!
const getDrawer = (wrapper: VueWrapper) => wrapper.get('aside.drawer')

describe('nouvelle fiche — vue En jeu', () => {
  it('réunit sorts lançables, capacités actives et armes équipées, groupés par coût', async () => {
    const wrapper = await mountPlay()

    const groups = wrapper.findAll('.play__group').map(group => [
      group.get('.play__group-title').text(),
      group.findAll('.play-card__name').map(name => name.text()),
    ])
    expect(groups).toEqual([
      [expect.stringContaining('Action'), ['Boule de feu', 'Décharge occulte', 'Dague']],
      [expect.stringContaining('Action bonus'), ['Maléfice', 'Second souffle']],
    ])
  })

  it('filtre par catégorie, par coût et par recherche', async () => {
    const wrapper = await mountPlay()

    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs.map(tab => tab.text().replace(/\s+/g, ''))).toEqual(['Tout5', 'Sorts3', 'Capacités1', 'Armes1', 'Objets0'])

    await tabs[1]!.trigger('click')
    expect(getCardNames(wrapper)).toEqual(['Boule de feu', 'Décharge occulte', 'Maléfice'])

    await wrapper.findAll('[role="radio"]').find(radio => radio.text().endsWith('Bonus'))!.trigger('click')
    expect(getCardNames(wrapper)).toEqual(['Maléfice'])

    await wrapper.findAll('[role="radio"]').find(radio => radio.text() === 'Tous')!.trigger('click')
    await wrapper.get('input[aria-label="Rechercher"]').setValue('decharge')
    expect(getCardNames(wrapper)).toEqual(['Décharge occulte'])
  })

  it('le tiroir d\'un sort fait choisir l\'emplacement et lancer le dépense', async () => {
    const wrapper = await mountPlay()

    await findCard(wrapper, 'Boule de feu').trigger('click')
    const drawer = getDrawer(wrapper)
    expect(drawer.text()).toContain('Boule de feu')
    expect(drawer.text()).toContain('Lancer au niveau')

    const slot = drawer.get('[role="radio"]')
    expect(slot.text()).toContain('Niveau 3')
    expect(slot.attributes('aria-checked')).toBe('true')

    await findButton(drawer, 'Lancer').trigger('click')
    await flushPromises()

    expect(findButton(getDrawer(wrapper), 'Lancer').attributes('disabled')).toBeDefined()
    expect(findCard(wrapper, 'Boule de feu').classes()).toContain('play-card--spent')
    expect(wrapper.text()).toContain('Boule de feu · dégâts fire')
  })

  it('le tiroir d\'une arme lance l\'attaque', async () => {
    const wrapper = await mountPlay()

    await findCard(wrapper, 'Dague').trigger('click')
    await findButton(getDrawer(wrapper), 'Attaquer').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Attaque — Dague')
  })

  it('utiliser une capacité dépense une utilisation et l\'enregistre', async () => {
    const wrapper = await mountPlay()

    await findCard(wrapper, 'Second souffle').trigger('click')
    expect(getDrawer(wrapper).text()).toContain('1 sur 1 · Repos court')

    await findButton(getDrawer(wrapper), 'Utiliser').trigger('click')
    await flushPromises()

    expect(featurePuts).toEqual([[{ featureId: secondWind.featureId, currentUses: 1 }]])
    expect(getDrawer(wrapper).text()).toContain('0 sur 1 · Repos court')
    expect(findButton(getDrawer(wrapper), 'Utiliser').attributes('disabled')).toBeDefined()
  })

  it('l\'inspiration se gagne et se dépense depuis le rail', async () => {
    const wrapper = await mountPlay()
    const getToggle = () => wrapper.get('[aria-label^="Inspiration"] button')

    expect(wrapper.get('.identity__inspiration').text()).toContain('aucune')
    await getToggle().trigger('click')
    expect(wrapper.get('.identity__inspiration').text()).toContain('disponible')
    expect(getToggle().attributes('aria-pressed')).toBe('true')

    await getToggle().trigger('click')
    expect(wrapper.get('.identity__inspiration').text()).toContain('aucune')
  })

  it('toucher la carte ouverte ou la croix referme le tiroir', async () => {
    const wrapper = await mountPlay()

    await findCard(wrapper, 'Dague').trigger('click')
    await getDrawer(wrapper).get('button[aria-label="Fermer"]').trigger('click')
    expect(wrapper.find('aside.drawer').exists()).toBe(false)

    await findCard(wrapper, 'Dague').trigger('click')
    await findCard(wrapper, 'Dague').trigger('click')
    expect(wrapper.find('aside.drawer').exists()).toBe(false)
  })
})
