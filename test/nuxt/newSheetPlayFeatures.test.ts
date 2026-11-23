import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { readBody } from 'h3'
import { clearNuxtData } from '#app'
import NewSheetPage from '../../app/pages/characters/[id]/nouvelle.vue'
import { barbareFeatures } from '../../server/db/seeds/data/barbare'
import { warlockFeatures } from '../../server/db/seeds/data/warlock'
import { abilityScores, featureRow, named } from '../fixtures/classSheet'

// The auth middleware would redirect to the login page and drop the sheet id from the route.
mockNuxtImport('navigateTo', () => vi.fn())

const SHEET_ID = 9403
const URL = `/api/character_sheets/${SHEET_ID}`
const BARBARIAN_ID = 7
const WARLOCK_ID = 9

const rage = featureRow(named(barbareFeatures, 'Rage'), BARBARIAN_ID)
const warlockRows = ['Magie de pacte', 'Manifestations occultes', 'Arcanum mystique (niveau 6)']
  .map(name => featureRow(named(warlockFeatures, name), WARLOCK_ID))

const featurePuts: unknown[] = []

registerEndpoint(URL, () => ({
  id: SHEET_ID,
  name: 'Brannoc',
  ruleset: '5',
  updatedAt: '2026-11-23T10:00:00.000Z',
  hpBase: 60,
  currentHp: 60,
  temporaryHp: 0,
  exhaustionLevel: 0,
  deathSaveSuccesses: 0,
  deathSaveFailures: 0,
  concentratingSpellId: null,
  concentratingOn: null,
  baseAbilityScores: abilityScores({ str: 16, cha: 14 }),
  classes: [
    { classId: BARBARIAN_ID, level: 3, isMain: true, class: { name: 'Barbare', hitDice: '1d12' }, subclass: null },
    { classId: WARLOCK_ID, level: 11, isMain: false, class: { name: 'Occultiste', hitDice: '1d8' }, subclass: null },
  ],
  features: [rage, ...warlockRows],
  spellSlots: [],
  proficiencyOverrides: [],
  abilityScoreImprovements: [],
  temporaryEffects: [],
  species: null,
  preferences: null,
  owner: { id: 1, name: 'PM', preferences: null },
}))
registerEndpoint(URL, { method: 'PUT', handler: async event => readBody(event) })
registerEndpoint(`${URL}/features`, {
  method: 'PUT',
  handler: async (event) => {
    featurePuts.push(await readBody(event))
    return { ok: true }
  },
})
for (const part of ['spells', 'inventory', 'backgrounds', 'spell_slots']) registerEndpoint(`${URL}/${part}`, () => [])
registerEndpoint('/api/items', () => [])

beforeEach(() => {
  clearNuxtData()
  featurePuts.length = 0
})

describe('nouvelle fiche — vue En jeu, capacités', () => {
  it('les emplacements de pacte, le compte des manifestations et les Arcanum ne deviennent pas des cartes', async () => {
    const wrapper = await mountSuspended(NewSheetPage, { route: `/characters/${SHEET_ID}/nouvelle` })
    await flushPromises()

    expect(wrapper.findAll('.play-card__name').map(name => name.text())).toEqual(['Rage'])
  })

  it('une capacité qui s\'active (Rage) s\'active depuis le tiroir et dépense sa réserve', async () => {
    const wrapper = await mountSuspended(NewSheetPage, { route: `/characters/${SHEET_ID}/nouvelle` })
    await flushPromises()

    await wrapper.get('button.play-card').trigger('click')
    const drawer = wrapper.get('aside.drawer')
    expect(drawer.text()).toContain('3 sur 3 · Repos long')

    await drawer.findAll('button').find(button => button.text().startsWith('Activer'))!.trigger('click')
    await vi.waitFor(() => expect(featurePuts).toEqual([
      [{ featureId: rage.featureId, currentUses: 1 }],
      [{ featureId: rage.featureId, active: true }],
    ]))
    expect(wrapper.get('aside.drawer').findAll('button').some(button => button.text().startsWith('Mettre fin'))).toBe(true)
  })
})
