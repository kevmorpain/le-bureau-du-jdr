import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mockNuxtImport, mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { readBody } from 'h3'
import { clearNuxtData } from '#app'
import NewSheetPage from '../../app/pages/characters/[id]/nouvelle.vue'
import { abilityScores } from '../fixtures/classSheet'

mockNuxtImport('navigateTo', () => vi.fn())

const SHEET_ID = 9405
const URL = `/api/character_sheets/${SHEET_ID}`

const item = (id: number, over: Record<string, unknown>) => ({
  id,
  description: null,
  effects: [],
  maxUses: null,
  rechargeType: null,
  rechargeDice: null,
  isCustom: false,
  rarity: null,
  requiresAttunement: false,
  attunementNote: null,
  weightG: 1000,
  costCp: null,
  lotSize: 1,
  ...over,
})

const entry = (id: number, entryItem: ReturnType<typeof item>, over: Record<string, unknown> = {}) => ({
  id,
  characterSheetId: SHEET_ID,
  itemId: entryItem.id,
  quantity: 1,
  equipped: false,
  magicBonus: 0,
  currentUses: 0,
  notes: null,
  usingTwoHanded: false,
  attuned: false,
  isPactWeapon: false,
  item: entryItem,
  ...over,
})

const LEATHER = item(1, { name: 'Armure de cuir', itemType: 'armor', properties: { armor_type: 'light', base_ac: 11, dex_limit: null, stealth_disadvantage: false }, weightG: 5000 })
const CHAIN = item(2, { name: 'Cotte de mailles', itemType: 'armor', properties: { armor_type: 'heavy', base_ac: 16, dex_limit: 0, stealth_disadvantage: true }, weightG: 27500 })
const DAGGER = item(3, { name: 'Dague', itemType: 'weapon', properties: { damage_dice: '1d4', damage_type: 'piercing', weapon_category: 'simple_melee', weapon_properties: ['finesse', 'light', 'thrown'], range: { normal: 6, long: 18 } }, weightG: 500 })
const RATIONS = item(4, { name: 'Rations (1 jour)', itemType: 'equipment', properties: { category: 'Nourriture' } })
const RING = item(5, { name: 'Anneau de protection', itemType: 'equipment', properties: { category: 'Objet merveilleux' }, rarity: 'rare', requiresAttunement: true, effects: [{ type: 'armor_class_bonus', value: { amount: 1 } }], weightG: null })

let stored: Record<string, unknown>
let inventory: ReturnType<typeof entry>[]
const puts: Record<string, unknown>[] = []
const entryUpdates: { id: number, body: Record<string, unknown> }[] = []
const entryDeletes: number[] = []
const entryPosts: Record<string, unknown>[] = []
const itemPosts: Record<string, unknown>[] = []

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
  baseAbilityScores: abilityScores({ str: 12, dex: 14 }),
  classes: [{ classId: 1, level: 3, isMain: true, class: { name: 'Guerrier', hitDice: '1d10' }, subclass: null }],
  features: [],
  spellSlots: [],
  proficiencyOverrides: [],
  abilityScoreImprovements: [],
  temporaryEffects: [],
  species: null,
  pp: 0,
  po: 10,
  pe: 0,
  pa: 3,
  pc: 0,
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
registerEndpoint(`${URL}/inventory`, () => inventory)
registerEndpoint(`${URL}/inventory`, {
  method: 'POST',
  handler: async (event) => {
    const body = await readBody(event)
    entryPosts.push(body)
    const added = entry(100 + entryPosts.length, item(body.itemId, { name: `Objet ${body.itemId}`, itemType: 'equipment', properties: { category: 'Divers' } }), { quantity: body.quantity })
    inventory = [...inventory, added]
    // The real POST answers with the item but without its effects.
    return { ...added, item: { ...added.item, effects: undefined } }
  },
})
// registerEndpoint matches whole paths: one route per entry.
for (const id of [11, 12, 13, 14, 15]) {
  registerEndpoint(`${URL}/inventory/${id}`, {
    method: 'PUT',
    handler: async (event) => {
      const body = await readBody(event)
      entryUpdates.push({ id, body })
      return { ...inventory.find(e => e.id === id), ...body }
    },
  })
  registerEndpoint(`${URL}/inventory/${id}`, {
    method: 'DELETE',
    handler: () => {
      entryDeletes.push(id)
      return { ok: true }
    },
  })
}
registerEndpoint('/api/items', () => [RATIONS, DAGGER])
registerEndpoint('/api/items', {
  method: 'POST',
  handler: async (event) => {
    const body = await readBody(event)
    itemPosts.push(body)
    return { id: 77, ...body }
  },
})
for (const part of ['spells', 'backgrounds', 'spell_slots']) registerEndpoint(`${URL}/${part}`, () => [])

const mounted: { unmount: () => void }[] = []

beforeEach(() => {
  clearNuxtData()
  stored = buildSheet()
  inventory = [
    entry(11, LEATHER, { equipped: true }),
    entry(12, CHAIN),
    entry(13, DAGGER, { equipped: true }),
    entry(14, RATIONS, { quantity: 3 }),
    entry(15, RING),
  ]
  for (const list of [puts, entryUpdates, entryDeletes, entryPosts, itemPosts]) list.length = 0
  localStorage.clear()
})

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount())
})

const mountInventory = async () => {
  const wrapper = await mountSuspended(NewSheetPage, { route: `/characters/${SHEET_ID}/nouvelle?view=inventory` })
  mounted.push(wrapper)
  await flushPromises()
  return wrapper
}

const SAVED = { timeout: 5000 }
// A link button with a plus sign reads « + Libellé ».
const labelOf = (text: string | null) => (text ?? '').replace(/\s+/g, ' ').trim().replace(/^\+ ?/, '')
const body = () => document.body
const dialog = () => body().querySelector('[role="dialog"]')!
const buttonIn = (root: Element, text: string) =>
  Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find(button => labelOf(button.textContent) === text)
const groupNames = (wrapper: Awaited<ReturnType<typeof mountInventory>>) =>
  Object.fromEntries(wrapper.findAll('section.group').map(group => [group.attributes('aria-label'), group.findAll('.item-row b').map(name => name.text())]))
const openEntry = async (wrapper: Awaited<ReturnType<typeof mountInventory>>, name: string) => {
  await wrapper.findAll('.item-row').find(row => row.text().includes(name))!.trigger('click')
  await flushPromises()
  return wrapper.get('aside.drawer')
}

describe('nouvelle fiche — vue Inventaire', () => {
  it('range les objets par rangement et compte chaque catégorie', async () => {
    const wrapper = await mountInventory()

    expect(groupNames(wrapper)).toEqual({
      'Équipé et lié': ['Armure de cuir', 'Dague'],
      'Consommables': ['Rations (1 jour)'],
      'Dans le sac': ['Anneau de protection', 'Cotte de mailles'],
    })
    expect(wrapper.get('.inventory__tabs').text()).toMatch(/Tout\s*5.*Armes\s*1.*Armures\s*2.*Objets magiques\s*1.*Consommables\s*1/s)
    expect(wrapper.find('.list-head__weight').exists()).toBe(false)
    expect(wrapper.get('section[aria-label="Liens"]').text()).toContain('0 sur 3')
  })

  it('la variante d\'encombrement ajoute la charge et la colonne Poids', async () => {
    stored = buildSheet({ preferences: { encumbrance: true } })
    const wrapper = await mountInventory()

    expect(wrapper.get('section[aria-label="Charge"]').text()).toContain('36,13 kg')
    expect(wrapper.findAll('.item-row').find(row => row.text().includes('Cotte de mailles'))!.get('.item-row__weight').text()).toBe('27,5 kg')
  })

  it('le tiroir d\'une arme équipée reprend ses chiffres de combat', async () => {
    const wrapper = await mountInventory()

    const drawer = await openEntry(wrapper, 'Dague')
    expect(drawer.text()).toContain('Dague')
    expect(drawer.text()).toContain('1d4')
    expect(drawer.text()).toContain('6 m / 18 m')
    expect(drawer.text()).toContain('Équipé et lié')
  })

  it('équiper une armure retire l\'armure déjà portée', async () => {
    const wrapper = await mountInventory()

    const drawer = await openEntry(wrapper, 'Cotte de mailles')
    expect(drawer.text()).toContain('CA 16')
    expect(drawer.text()).toContain('Désavantage')
    await drawer.findAll('button').find(button => button.text() === 'Équiper')!.trigger('click')
    await flushPromises()

    await vi.waitFor(() => expect(entryUpdates).toEqual([{ id: 11, body: { equipped: false } }, { id: 12, body: { equipped: true } }]))
    expect(groupNames(wrapper)['Équipé et lié']).toEqual(['Cotte de mailles', 'Dague'])
  })

  it('un objet à lier se lie, et le compteur de liens suit', async () => {
    const wrapper = await mountInventory()

    const drawer = await openEntry(wrapper, 'Anneau de protection')
    expect(drawer.text()).toContain('Rare')
    await drawer.findAll('button').find(button => button.text() === 'Lier')!.trigger('click')
    await flushPromises()

    expect(entryUpdates.at(-1)).toEqual({ id: 15, body: { attuned: true } })
    expect(wrapper.get('section[aria-label="Liens"]').text()).toContain('1 sur 3')
    expect(groupNames(wrapper)['Équipé et lié']).toContain('Anneau de protection')
  })

  it('« Utiliser » décompte un consommable ; le dernier se retire après confirmation', async () => {
    inventory = [entry(14, RATIONS, { quantity: 2 })]
    const wrapper = await mountInventory()

    let drawer = await openEntry(wrapper, 'Rations')
    await drawer.findAll('button').find(button => button.text() === 'Utiliser')!.trigger('click')
    await flushPromises()
    expect(entryUpdates).toEqual([{ id: 14, body: { quantity: 1 } }])

    drawer = wrapper.get('aside.drawer')
    await drawer.findAll('button').find(button => button.text() === 'Utiliser')!.trigger('click')
    await vi.waitFor(() => expect(dialog().textContent).toContain('Rations (1 jour) quitte l\'inventaire.'))
    expect(entryDeletes).toEqual([])

    buttonIn(dialog(), 'Retirer')!.click()
    await vi.waitFor(() => expect(entryDeletes).toEqual([14]))
    expect(wrapper.findAll('.item-row')).toHaveLength(0)
  })

  it('la fenêtre d\'ajout ajoute la sélection avec sa quantité, et l\'objet apparaît', async () => {
    const wrapper = await mountInventory()

    await wrapper.findAll('button').find(button => labelOf(button.text()) === 'Ajouter un objet')!.trigger('click')
    await vi.waitFor(() => expect(dialog().textContent).toContain('Rations (1 jour)'))
    const box = Array.from(dialog().querySelectorAll('label.checkbox')).find(label => label.textContent?.includes('Rations'))!
    box.querySelector('input')!.click()
    await vi.waitFor(() => expect(dialog().textContent).toContain('Sélection · 1 objet'))
    const quantity = dialog().querySelector<HTMLInputElement>('input[aria-label="Quantité de Rations (1 jour)"]')!
    quantity.value = '4'
    quantity.dispatchEvent(new Event('input'))
    await flushPromises()
    buttonIn(dialog(), 'Ajouter 1 objet')!.click()

    await vi.waitFor(() => expect(entryPosts).toEqual([{ itemId: 4, quantity: 4, equipped: false, magicBonus: 0 }]))
    await vi.waitFor(() => expect(wrapper.findAll('.item-row b').map(name => name.text())).toContain('Objet 4'))
  })

  it('créer un objet l\'enregistre au catalogue puis l\'ajoute à l\'inventaire', async () => {
    const wrapper = await mountInventory()

    await wrapper.findAll('button').find(button => labelOf(button.text()) === 'Ajouter un objet')!.trigger('click')
    await vi.waitFor(() => expect(dialog()).not.toBeNull())
    buttonIn(dialog(), 'Créer un objet')!.click()
    await vi.waitFor(() => expect(dialog().querySelector('input[aria-label="Nom"]')).not.toBeNull())
    const name = dialog().querySelector<HTMLInputElement>('input[aria-label="Nom"]')!
    name.value = 'Baguette d\'essai'
    name.dispatchEvent(new Event('input'))
    const charges = dialog().querySelector<HTMLInputElement>('input[aria-label="Charges max"]')!
    charges.value = '3'
    charges.dispatchEvent(new Event('input'))
    await flushPromises()
    buttonIn(dialog(), 'Bonus à la CA')!.click()
    await flushPromises()
    buttonIn(dialog(), 'Ajouter')!.click()

    await vi.waitFor(() => expect(itemPosts).toHaveLength(1))
    expect(itemPosts[0]).toMatchObject({ name: 'Baguette d\'essai', itemType: 'equipment', maxUses: 3, effects: [{ type: 'armor_class_bonus' }] })
    await vi.waitFor(() => expect(entryPosts).toEqual([{ itemId: 77, quantity: 1, equipped: false, magicBonus: 0 }]))
  })

  it('la bourse gagne, dépense et corrige, et le résultat s\'affiche dans la fenêtre', async () => {
    const wrapper = await mountInventory()

    await wrapper.get('button.coins').trigger('click')
    await vi.waitFor(() => expect(dialog().textContent).toContain('Bourse'))
    const coin = (key: string) => dialog().querySelector<HTMLInputElement>(`input[aria-label="Pièces de ${key}"]`)!
    const type = async (key: string, value: string) => {
      coin(key).value = value
      coin(key).dispatchEvent(new Event('input'))
      await flushPromises()
    }

    await type('po', '5')
    buttonIn(dialog(), 'Ajouter')!.click()
    await vi.waitFor(() => expect(dialog().textContent).toContain('Fait : +5 po.'))

    buttonIn(dialog(), 'Dépenser')!.click()
    await flushPromises()
    await type('pa', '7')
    Array.from(dialog().querySelectorAll<HTMLButtonElement>('button')).filter(button => button.textContent?.trim() === 'Dépenser').at(-1)!.click()
    await vi.waitFor(() => expect(dialog().textContent).toContain('Fait : −7 pa.'))

    await vi.waitFor(() => expect(puts.at(-1)).toMatchObject({ po: 15, pa: 0 }), SAVED)
    expect(wrapper.get('button.coins').text()).toContain('15')
  })
})
