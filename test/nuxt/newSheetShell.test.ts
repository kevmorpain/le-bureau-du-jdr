import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { readBody } from 'h3'
import { clearNuxtData } from '#app'
import NewSheetPage from '../../app/pages/characters/[id]/nouvelle.vue'
import OldSheetPage from '../../app/pages/characters/[id]/index.vue'
import { useOfflineSync } from '../../app/composables/useOfflineSync'

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateToMock)

const SHEET_ID = 9401
const URL = `/api/character_sheets/${SHEET_ID}`

let stored: Record<string, unknown>
const events: string[] = []
const puts: Record<string, unknown>[] = []

const sheet = (over: Record<string, unknown> = {}) => ({
  id: SHEET_ID,
  name: 'Ambroise',
  updatedAt: '2026-11-22T10:00:00.000Z',
  hpBase: 20,
  currentHp: 14,
  temporaryHp: 5,
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
  ...over,
})

registerEndpoint(URL, () => {
  events.push('get')
  return stored
})
registerEndpoint(URL, {
  method: 'PUT',
  handler: async (event) => {
    const body = await readBody(event)
    puts.push(body)
    events.push('put')
    stored = body
    return body
  },
})
for (const part of ['inventory', 'backgrounds', 'spells', 'spell_slots']) registerEndpoint(`${URL}/${part}`, () => [])
registerEndpoint('/api/items', () => [])

beforeEach(() => {
  // Même adresse d'un test à l'autre : sans purge, `useFetch` resservirait la fiche du test précédent.
  clearNuxtData()
  stored = sheet()
  events.length = 0
  puts.length = 0
  navigateToMock.mockReset()
  // Le montage avec `route` passe aussi par navigateTo, avec un objet : seuls les chemins écrits par la fiche comptent.
  navigateToMock.mockImplementation((to: unknown) => {
    if (typeof to === 'string') events.push(`navigate ${to}`)
  })
  useOfflineSync().conflicts.value = []
})

const navigations = () => events.filter(event => event.startsWith('navigate'))

const mountNew = (query = '') => mountSuspended(NewSheetPage, { route: `/characters/${SHEET_ID}/nouvelle${query}` })

// UTooltip exige un UApp parent : sans objet ici, on le remplace par son contenu.
const mountOld = () => mountSuspended(OldSheetPage, {
  route: `/characters/${SHEET_ID}`,
  global: { stubs: { UTooltip: { template: '<div><slot /></div>' } } },
})

describe('nouvelle fiche — coquille', () => {
  it('la tranche liste les six vues et le retour aux personnages, la vue courante marquée', async () => {
    const wrapper = await mountNew('?vue=inventaire')

    const nav = wrapper.get('nav')
    const labels = nav.findAll('a').map(link => link.text())
    expect(labels).toEqual(['En jeu', 'Personnage', 'Inventaire', 'Grimoire', 'Notes', 'Réglages', 'Personnages'])
    expect(nav.get('[aria-current="page"]').text()).toBe('Inventaire')
    expect(nav.get('[aria-label^="Sauvegarde"]').attributes('aria-label')).toBe('Sauvegarde : enregistré')
  })

  it('le rail montre le personnage : nom, classe, PV et effets en cours', async () => {
    stored = sheet({
      temporaryEffects: [{ id: 'b', name: 'Bénédiction', active: true, effects: [], countdown: { rounds: 10, remaining: 3 } }],
    })
    const wrapper = await mountNew()

    const rail = wrapper.get('aside')
    expect(rail.text()).toContain('Ambroise')
    expect(rail.text()).toContain('Occultiste · niv. 3')
    expect(rail.text()).toContain('14')
    expect(rail.text()).toContain('+5 temp.')
    expect(rail.text()).toContain('Bénédiction')
    expect(rail.text()).toContain('3 rounds')
  })

  it('au toucher, l\'indicateur détaille l\'état et propose l\'action utile', async () => {
    const wrapper = await mountNew()
    useOfflineSync().pendingCount.value = 3
    await flushPromises()

    await wrapper.get('[aria-label^="Sauvegarde"]').trigger('click')
    await flushPromises()

    expect(document.body.textContent).toContain('3 changements en attente')
    expect(document.body.textContent).toContain('Envoyer maintenant')
    useOfflineSync().pendingCount.value = 0
  })

  it('un conflit sur ce personnage affiche le bandeau', async () => {
    const wrapper = await mountNew()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)

    useOfflineSync().conflicts.value = [SHEET_ID]
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('Conflit de synchronisation')
  })
})

describe('choix du design de la fiche', () => {
  it('« Ancien » enregistre puis relit la fiche avant de rouvrir l\'ancienne, qui sinon renverrait ici', async () => {
    stored = sheet({ preferences: { newSheet: true } })
    const wrapper = await mountNew('?vue=reglages')
    events.length = 0

    const option = (label: string) => wrapper.findAll('[role="radio"]').find(button => button.text() === label)!
    expect(option('Nouveau').attributes('aria-checked')).toBe('true')

    await option('Ancien').trigger('click')
    await vi.waitFor(() => expect(events).toHaveLength(3))

    expect(puts.at(-1)?.preferences).toEqual({ newSheet: false })
    expect(events).toEqual(['put', 'get', `navigate /characters/${SHEET_ID}`])
  })

  it('« Nouveau » depuis la nouvelle fiche enregistre sans quitter les Réglages', async () => {
    const wrapper = await mountNew('?vue=reglages')
    events.length = 0

    await wrapper.findAll('[role="radio"]').find(button => button.text() === 'Nouveau')!.trigger('click')
    await vi.waitFor(() => expect(puts).toHaveLength(1))

    expect(puts[0]?.preferences).toEqual({ newSheet: true })
    expect(events).toEqual(['put'])
  })

  it('l\'ancienne fiche renvoie vers la nouvelle quand la fiche l\'a choisie', async () => {
    stored = sheet({ preferences: { newSheet: true } })
    await mountOld()

    expect(navigateToMock).toHaveBeenCalledWith(`/characters/${SHEET_ID}/nouvelle`, { replace: true })
    expect(navigations()).toEqual([`navigate /characters/${SHEET_ID}/nouvelle`])
  })

  it('le défaut du compte suffit, et sans choix l\'ancienne fiche reste', async () => {
    stored = sheet({ owner: { id: 1, name: 'PM', preferences: { newSheet: true } } })
    await mountOld()
    expect(navigations()).toEqual([`navigate /characters/${SHEET_ID}/nouvelle`])

    events.length = 0
    clearNuxtData()
    stored = sheet()
    await mountOld()
    expect(navigations()).toEqual([])
  })
})
