import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { readBody } from 'h3'
import { clearNuxtData, useState } from '#app'
import NewSheetPage from '../../app/pages/characters/[id]/nouvelle.vue'
import { spells } from '../../server/db/seeds/data/spells'
import { rollTables } from '../../server/db/seeds/data/rollTables'
import { abilityScores } from '../fixtures/classSheet'

mockNuxtImport('navigateTo', () => vi.fn())

const SHEET_ID = 9407
const URL = `/api/character_sheets/${SHEET_ID}`
const CONFUSION_TABLE_ID = 41

const confusionTable = rollTables.find(table => table.key === 'confusion')!
let preferences: Record<string, boolean> | null = null

registerEndpoint(URL, () => ({
  id: SHEET_ID,
  name: 'Ambroise',
  ruleset: '5',
  updatedAt: '2026-11-27T10:00:00.000Z',
  hpBase: 30,
  currentHp: 30,
  temporaryHp: 0,
  exhaustionLevel: 0,
  deathSaveSuccesses: 0,
  deathSaveFailures: 0,
  concentratingSpellId: null,
  concentratingOn: null,
  baseAbilityScores: abilityScores(),
  classes: [{ classId: 3, level: 7, isMain: true, class: { name: 'Guerrier', hitDice: '1d10' }, subclass: null }],
  features: [],
  spellSlots: [{ slotType: 'spellcasting', slotLevel: 4, total: 1, used: 0, created: 0 }],
  proficiencyOverrides: [],
  abilityScoreImprovements: [],
  temporaryEffects: [],
  species: null,
  preferences,
  owner: { id: 1, name: 'PM', preferences: null },
}))
registerEndpoint(URL, { method: 'PUT', handler: async event => readBody(event) })
registerEndpoint(`${URL}/spells`, () => [{
  characterSheetId: SHEET_ID,
  spellId: 820,
  classId: null,
  isKnown: true,
  isPrepared: true,
  alwaysPrepared: false,
  source: null,
  spell: { ...spells.find(spell => spell.name === 'Confusion')!, id: 820, rollTableId: CONFUSION_TABLE_ID, school: { name: 'Enchantment' } },
}])
registerEndpoint(`/api/catalog/roll-tables/${CONFUSION_TABLE_ID}`, () => ({ name: confusionTable.name, die: confusionTable.die, entries: confusionTable.entries }))
for (const part of ['inventory', 'backgrounds', 'spell_slots']) registerEndpoint(`${URL}/${part}`, () => [])
registerEndpoint(`${URL}/spell-slots`, { method: 'PUT', handler: async event => readBody(event) })
registerEndpoint('/api/items', () => [])

const mounted: { unmount: () => void }[] = []

beforeEach(() => {
  clearNuxtData()
  preferences = null
  useState('dice-toasts').value = []
})

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
  vi.restoreAllMocks()
})

const openConfusion = async () => {
  const wrapper = await mountSuspended(NewSheetPage, { route: `/characters/${SHEET_ID}/nouvelle` })
  mounted.push(wrapper)
  await flushPromises()
  await wrapper.findAll('button.play-card').find(card => card.text().includes('Confusion'))!.trigger('click')
  await vi.waitFor(() => expect(wrapper.find('aside.drawer section[aria-label="Confusion"]').exists()).toBe(true))
  return wrapper
}

const table = (wrapper: Awaited<ReturnType<typeof openConfusion>>) => wrapper.get('aside.drawer section[aria-label="Confusion"]')
const highlighted = (wrapper: Awaited<ReturnType<typeof openConfusion>>) => table(wrapper).find('[aria-current="true"]')

describe('nouvelle fiche — table aléatoire dans le tiroir', () => {
  it('le tiroir du sort montre sa table, et le jet éclaire la ligne obtenue sans notification', async () => {
    const wrapper = await openConfusion()

    expect(table(wrapper).text()).toContain('Table · d10')
    expect(table(wrapper).findAll('li')).toHaveLength(confusionTable.entries.length)
    expect(highlighted(wrapper).exists()).toBe(false)

    // The d10 lands on 9.
    vi.spyOn(Math, 'random').mockReturnValue(0.85)
    await table(wrapper).findAll('button').find(button => button.text() === 'Lancer le d10')!.trigger('click')

    expect(highlighted(wrapper).text()).toContain('9-10')
    expect(table(wrapper).text()).toContain('Derniers jets : 9')
    expect(wrapper.find('.toasts').text()).toBe('')
  })

  it('jets désactivés : le d10 se saisit à la main et la ligne s\'éclaire', async () => {
    preferences = { diceRolls: false }
    const wrapper = await openConfusion()

    expect(table(wrapper).findAll('button').map(button => button.text())).not.toContain('Lancer le d10')
    await table(wrapper).get('input[aria-label="d10 obtenu"]').setValue('2')

    expect(highlighted(wrapper).text()).toContain('2-6')
  })
})
