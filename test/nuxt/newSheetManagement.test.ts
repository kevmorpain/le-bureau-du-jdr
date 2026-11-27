import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { createError, readBody } from 'h3'
import { clearNuxtData } from '#app'
import NewSheetPage from '../../app/pages/characters/[id]/nouvelle.vue'
import { barbareFeatures } from '../../server/db/seeds/data/barbare'
import { abilityScores, featureRow, named } from '../fixtures/classSheet'

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateToMock)

const SHEET_ID = 9404
const URL = `/api/character_sheets/${SHEET_ID}`
const BARBARIAN_ID = 7

const rage = featureRow(named(barbareFeatures, 'Rage'), BARBARIAN_ID)
const unarmoredDefense = featureRow(named(barbareFeatures, 'Défense sans armure'), BARBARIAN_ID)

let stored: Record<string, unknown>
const puts: Record<string, unknown>[] = []
const accountPuts: Record<string, unknown>[] = []
let accountPreferences: Record<string, boolean> | null = null
let deletes = 0
let isDeleteFailing = false

const buildSheet = (over: Record<string, unknown> = {}) => ({
  id: SHEET_ID,
  name: 'Brannoc',
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
  currentHitDie: null,
  baseAbilityScores: abilityScores({ str: 16, dex: 14 }),
  classes: [{ classId: BARBARIAN_ID, level: 3, isMain: true, class: { name: 'Barbare', hitDice: '1d12' }, subclass: null }],
  features: [rage, unarmoredDefense],
  spellSlots: [],
  proficiencyOverrides: [
    { proficiencyType: 'saving_throw', value: 'str', action: 'grant' },
    { proficiencyType: 'skill', value: 'athletics', action: 'grant' },
    { proficiencyType: 'skill', value: 'stealth', action: 'expertise' },
  ],
  abilityScoreImprovements: [],
  temporaryEffects: [],
  species: null,
  alignment: 'CG',
  notes: 'Session 1 — le gué du Corbeau.\n\nSession 2 — Maître Orvald, le passeur.',
  personalityTraits: 'Rit trop fort.',
  preferences: null,
  owner: { id: 1, name: 'PM', preferences: null },
  ...over,
})

registerEndpoint(URL, () => stored)
registerEndpoint(URL, {
  method: 'PUT',
  handler: async (event) => {
    const body = await readBody(event)
    puts.push(body)
    stored = body
    return body
  },
})
registerEndpoint(URL, {
  method: 'DELETE',
  handler: () => {
    if (isDeleteFailing) throw createError({ statusCode: 503 })
    deletes++
    return { ok: true }
  },
})
registerEndpoint('/api/account/preferences', () => ({ preferences: accountPreferences }))
registerEndpoint('/api/account/preferences', {
  method: 'PUT',
  handler: async (event) => {
    const body = await readBody(event)
    accountPuts.push(body)
    accountPreferences = body
    return { preferences: body }
  },
})
for (const part of ['spells', 'inventory', 'backgrounds', 'spell_slots']) registerEndpoint(`${URL}/${part}`, () => [])
registerEndpoint('/api/items', () => [])

beforeEach(() => {
  clearNuxtData()
  stored = buildSheet()
  puts.length = 0
  accountPuts.length = 0
  accountPreferences = null
  deletes = 0
  isDeleteFailing = false
  navigateToMock.mockReset()
  localStorage.clear()
})

const mounted: { unmount: () => void }[] = []
afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
})

const mountView = async (view: string) => {
  const wrapper = await mountSuspended(NewSheetPage, { route: `/characters/${SHEET_ID}/nouvelle?view=${view}` })
  mounted.push(wrapper)
  await flushPromises()
  return wrapper
}

// The sheet autosaves two seconds after the last change.
const SAVED = { timeout: 5000 }

// Windows are teleported to the body; the page itself is not attached to the document.
const body = () => document.body
const buttonByText = (root: Element, text: string) =>
  Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find(button => button.textContent?.trim() === text)
const radioByText = (root: Element, text: string, index = 0) =>
  Array.from(root.querySelectorAll<HTMLElement>('[role="radio"]')).filter(button => button.textContent?.trim() === text)[index]
const dialog = () => body().querySelector('[role="dialog"]')!

describe('nouvelle fiche — vue Personnage', () => {
  it('montre les modificateurs, sauvegardes et compétences avec leur niveau de maîtrise', async () => {
    const wrapper = await mountView('character')

    const strength = wrapper.findAll('.tile').find(tile => tile.text().includes('Force'))!
    expect(strength.get('.tile__mod').text()).toBe('+3')
    expect(strength.text()).toContain('score 16')
    expect(strength.get('.tile__save-value').text()).toBe('+5')
    expect(strength.get('.tile__save .mark').classes()).toContain('mark--proficient')

    const skills = wrapper.findAll('.skill')
    expect(skills).toHaveLength(18)
    expect(skills[0]!.text()).toContain('Acrobaties')
    const stealth = skills.find(skill => skill.text().includes('Discrétion'))!
    expect(stealth.get('.skill__value').text()).toBe('+6')
    expect(stealth.get('.mark').classes()).toContain('mark--expert')
    const athletics = skills.find(skill => skill.text().includes('Athlétisme'))!
    expect(athletics.get('.skill__value').text()).toBe('+5')
    expect(athletics.get('.mark').classes()).toContain('mark--proficient')
  })

  it('un toucher sur une compétence lance son jet', async () => {
    const wrapper = await mountView('character')

    await wrapper.findAll('.skill').find(skill => skill.text().includes('Athlétisme'))!.trigger('click')

    await vi.waitFor(() => expect(wrapper.find('.toasts').text()).toContain('Athlétisme'))
  })

  it('« Traits et passifs » liste les capacités sans action, regroupées par classe', async () => {
    const wrapper = await mountView('character')

    const passives = wrapper.findAll('section[aria-label="Traits et passifs"] .accordion').map(button => button.text())
    expect(passives).toEqual([expect.stringContaining('Défense sans armure')])
    expect(wrapper.get('section[aria-label="Traits et passifs"]').text()).toContain('Barbare')
  })

  it('les dés de vie restants se règlent et s\'enregistrent', async () => {
    const wrapper = await mountView('character')
    const state = wrapper.get('section[aria-label="État"]')
    expect(state.text()).toContain('3 sur 3')

    await state.get('[aria-label="Dés de vie · d12"] button:nth-child(2)').trigger('click')

    expect(state.text()).toContain('2 sur 3')
    await vi.waitFor(() => expect(puts.at(-1)?.currentHitDie).toEqual([{ die: '12', count: 2 }]), SAVED)
  })
})

describe('nouvelle fiche — vue Notes', () => {
  it('les notes s\'enregistrent, et la recherche ne garde que les passages qui correspondent', async () => {
    const wrapper = await mountView('notes')

    await wrapper.get('textarea[aria-label="Notes"]').setValue('Session 3 — la tour.')
    await vi.waitFor(() => expect(puts.at(-1)?.notes).toBe('Session 3 — la tour.'), SAVED)

    await wrapper.get('textarea[aria-label="Notes"]').setValue(buildSheet().notes as string)
    await wrapper.get('input[aria-label="Chercher dans les notes"]').setValue('orvald')
    expect(wrapper.findAll('.notes__match').map(match => match.text())).toEqual(['Session 2 — Maître Orvald, le passeur.'])
    expect(wrapper.text()).toContain('Un passage correspond.')
  })

  it('la fiche d\'identité s\'ouvre par section', async () => {
    const wrapper = await mountView('notes')

    expect(wrapper.text()).toContain('Barbare 3 · Chaotique Bon')
    const personality = wrapper.findAll('.accordion').find(button => button.text().includes('Personnalité'))!
    await personality.trigger('click')
    expect(wrapper.text()).toContain('Rit trop fort.')
  })

  it('« Modifier » ouvre l\'identité, qui enregistre ce qu\'on y saisit', async () => {
    const wrapper = await mountView('notes')

    await wrapper.findAll('button').find(button => button.text() === 'Modifier')!.trigger('click')
    await vi.waitFor(() => expect(body().querySelector('[role="dialog"]')?.textContent).toContain('Identité et description'))

    const age = body().querySelector<HTMLInputElement>('input[aria-label="Âge"]')!
    age.value = '31 ans'
    age.dispatchEvent(new Event('input'))
    const ideals = body().querySelector<HTMLTextAreaElement>('textarea[aria-label="Idéaux"]')!
    ideals.value = 'La liberté.'
    ideals.dispatchEvent(new Event('input'))

    await vi.waitFor(() => expect(puts.at(-1)).toMatchObject({ age: '31 ans', ideals: 'La liberté.' }), SAVED)
  })
})

describe('nouvelle fiche — vue Réglages', () => {
  const AMMUNITION = '[role="radiogroup"][aria-label="Décompter les munitions"]'

  it('un réglage tranché pour la fiche s\'enregistre ; « Compte » rend la main au compte', async () => {
    stored = buildSheet({ owner: { id: 1, name: 'PM', preferences: { ammunition: true } } })
    const wrapper = await mountView('settings')
    const ammunition = wrapper.get(AMMUNITION).element

    expect(radioByText(ammunition, 'Compte (oui)')!.getAttribute('aria-checked')).toBe('true')

    radioByText(ammunition, 'Non')!.click()
    await vi.waitFor(() => expect(puts.at(-1)?.preferences).toEqual({ ammunition: false }), SAVED)
    expect(wrapper.text()).toContain('Ceux du compte, sauf un réglage propre')

    radioByText(ammunition, 'Compte (oui)')!.click()
    await vi.waitFor(() => expect(puts.at(-1)?.preferences).toBeNull(), SAVED)
  })

  it('les défauts du compte se règlent dans leur fenêtre, et la fiche en hérite aussitôt', async () => {
    const wrapper = await mountView('settings')
    expect(radioByText(wrapper.get(AMMUNITION).element, 'Compte (non)')).toBeDefined()

    buttonByText(wrapper.element, 'Régler les défauts du compte')!.click()
    await vi.waitFor(() => expect(dialog().querySelector(AMMUNITION)).not.toBeNull())
    radioByText(dialog().querySelector(AMMUNITION)!, 'Oui')!.click()

    await vi.waitFor(() => expect(accountPuts.at(-1)).toEqual({ ammunition: true }))
    await vi.waitFor(() => expect(radioByText(wrapper.get(AMMUNITION).element, 'Compte (oui)')).toBeDefined())
  })

  it('supprimer passe par une confirmation, puis renvoie à la liste sans rien laisser sur l\'appareil', async () => {
    localStorage.setItem(`char:${SHEET_ID}:rollHistory`, '[]')
    localStorage.setItem('char:1:rollHistory', '[]')
    const wrapper = await mountView('settings')

    buttonByText(wrapper.element, 'Supprimer ce personnage')!.click()
    await vi.waitFor(() => expect(dialog().textContent).toContain('irréversible'))
    expect(dialog().textContent).toContain('Barbare 3')
    expect(deletes).toBe(0)

    buttonByText(dialog(), 'Supprimer ce personnage')!.click()

    await vi.waitFor(() => expect(navigateToMock).toHaveBeenCalledWith('/characters'))
    expect(deletes).toBe(1)
    expect(localStorage.getItem(`char:${SHEET_ID}:rollHistory`)).toBeNull()
    expect(localStorage.getItem('char:1:rollHistory')).toBe('[]')
  })

  it('une suppression qui échoue le dit dans la page, sans quitter la fiche', async () => {
    isDeleteFailing = true
    const wrapper = await mountView('settings')

    buttonByText(wrapper.element, 'Supprimer ce personnage')!.click()
    await vi.waitFor(() => expect(body().querySelector('[role="dialog"]')).not.toBeNull())
    buttonByText(dialog(), 'Supprimer ce personnage')!.click()

    await vi.waitFor(() => expect(wrapper.text()).toContain('La suppression a échoué'))
    expect(navigateToMock).not.toHaveBeenCalledWith('/characters')
  })
})
