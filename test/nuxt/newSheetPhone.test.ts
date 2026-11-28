import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { Component } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { clearNuxtData, useState } from '#app'
import NewSheetPage from '../../app/pages/characters/[id]/nouvelle.vue'

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateToMock)

// The phone layout is chosen by CSS alone: happy-dom renders both layouts, and these tests read the phone one.

const SHEET_ID = 9451
const URL = `/api/character_sheets/${SHEET_ID}`

const sheet = {
  id: SHEET_ID,
  name: 'Ambroise',
  updatedAt: '2026-11-28T10:00:00.000Z',
  hpBase: 20,
  currentHp: 14,
  temporaryHp: 0,
  exhaustionLevel: 0,
  deathSaveSuccesses: 0,
  deathSaveFailures: 0,
  concentratingSpellId: null,
  concentratingOn: null,
  baseAbilityScores: [{ abilityId: 'dex', value: 14 }],
  classes: [{ classId: 1, level: 3, isMain: true, class: { name: 'Occultiste', hitDice: '1d8' } }],
  features: [],
  proficiencyOverrides: [],
  abilityScoreImprovements: [],
  temporaryEffects: [],
  species: null,
  preferences: null,
  owner: { id: 1, name: 'PM', preferences: null },
}

registerEndpoint(URL, () => sheet)
registerEndpoint(URL, { method: 'PUT', handler: () => sheet })
for (const part of ['inventory', 'backgrounds', 'spells', 'spell_slots']) registerEndpoint(`${URL}/${part}`, () => [])

const windowState = () => useState(`sheet-windows-${SHEET_ID}`)

const mounted: { unmount: () => void }[] = []

beforeEach(() => {
  clearNuxtData()
  windowState().value = null
})

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
})

// Closing the real drawer animates through reka's Presence, which happy-dom cannot follow (unhandled rejection).
const SheetStub = { props: ['open', 'title'], template: '<div v-if="open" class="sheet-stub"><slot /></div>' }

const mountPage = async (query = '', stubs: Record<string, Component> = {}) => {
  const wrapper = await mountSuspended(NewSheetPage, { route: `/characters/${SHEET_ID}/nouvelle${query}`, global: { stubs } })
  mounted.push(wrapper)
  return wrapper
}

const bodyButton = (label: string) =>
  Array.from(document.body.querySelectorAll('button')).find(button => button.getAttribute('aria-label') === label || button.textContent?.trim() === label)

describe('nouvelle fiche — téléphone', () => {
  it('la barre d\'onglets garde quatre vues ; « Plus » mène à Notes, Réglages et Personnages', async () => {
    const wrapper = await mountPage('?view=notes')

    const tabs = wrapper.get('nav.sheet__tabs')
    expect(tabs.findAll('a').map(link => link.text())).toEqual(['En jeu', 'Personnage', 'Inventaire', 'Grimoire'])
    const more = tabs.get('button')
    expect(more.text()).toBe('Plus')
    expect(more.attributes('aria-current')).toBe('page')

    await more.trigger('click')
    await vi.waitFor(() => expect(document.body.querySelector('[role="dialog"]')).not.toBeNull())

    const links = Array.from(document.body.querySelectorAll('[role="dialog"] a'))
    expect(links.map(link => link.textContent?.trim())).toEqual(['Notes', 'Réglages', 'Personnages'])
    expect(links.map(link => link.getAttribute('href'))).toEqual([
      `/characters/${SHEET_ID}/nouvelle?view=notes`,
      `/characters/${SHEET_ID}/nouvelle?view=settings`,
      '/characters',
    ])
    expect(links[0]!.getAttribute('aria-current')).toBe('page')
  })

  it('les PV de l\'en-tête ouvrent la fenêtre des points de vie', async () => {
    const wrapper = await mountPage()

    await wrapper.get('header.sheet__header button[aria-label^="Points de vie"]').trigger('click')
    await flushPromises()

    expect(windowState().value).toBe('hitPoints')
    await vi.waitFor(() => expect(document.body.querySelector('[role="dialog"]')?.textContent).toContain('Points de vie'))
  })

  it('l\'en-tête déplie le rail ; une fenêtre ouverte depuis le rail remplace la feuille', async () => {
    const wrapper = await mountPage('', { DsSheet: SheetStub })

    await wrapper.get('header.sheet__header button[aria-label^="Déplier la fiche"]').trigger('click')
    expect(windowState().value).toBe('rail')

    const rest = wrapper.get('.sheet-stub aside').findAll('button').find(button => button.text() === 'Repos')!
    await rest.trigger('click')
    await flushPromises()

    expect(windowState().value).toBe('rest')
    expect(wrapper.find('.sheet-stub').exists()).toBe(false)
    await vi.waitFor(() => expect(bodyButton('Repos court')).toBeDefined())
  })
})
