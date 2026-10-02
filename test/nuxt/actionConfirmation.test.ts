import { describe, it, expect, vi } from 'vitest'
import { reactive } from 'vue'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import DashboardHeaderSection from '../../app/components/character_sheet/DashboardHeaderSection.vue'
import InventorySection from '../../app/components/character_sheet/InventorySection.vue'

// U7 : le repos long et la suppression d'un objet partaient au premier clic. Ils demandent désormais confirmation ; la
// confirmation du repos long porte la case « mangé et bu » quand le personnage est épuisé (AideDD, Conditions).

const SHEET_ID = 9302
const entry = {
  id: 1,
  characterSheetId: SHEET_ID,
  itemId: 1,
  quantity: 1,
  equipped: false,
  attuned: false,
  magicBonus: 0,
  currentUses: 0,
  notes: null,
  usingTwoHanded: false,
  item: {
    id: 1, name: 'Corde de chanvre', itemType: 'equipment', properties: { category: 'adventuring_gear' }, description: null, effects: [],
    maxUses: null, rechargeType: null, rechargeDice: null, isCustom: false, rarity: null, requiresAttunement: false, attunementNote: null,
  },
}
let inventory = [entry]
const deletions: string[] = []

registerEndpoint(`/api/character_sheets/${SHEET_ID}/inventory`, () => inventory)
registerEndpoint(`/api/character_sheets/${SHEET_ID}/inventory/1`, {
  method: 'DELETE',
  handler: () => {
    deletions.push('1')
    inventory = []
    return { success: true }
  },
})
registerEndpoint(`/api/character_sheets/${SHEET_ID}/proficiency-overrides`, () => [])
registerEndpoint(`/api/character_sheets/${SHEET_ID}/spells`, () => [])
registerEndpoint('/api/backgrounds', () => [])
registerEndpoint('/api/items', () => [])

const sheet = (over: Record<string, unknown> = {}) => reactive({
  id: SHEET_ID,
  name: 'Brom',
  exhaustionLevel: 0,
  baseAbilityScores: [],
  classes: [],
  features: [],
  skills: [],
  abilityScoreImprovements: [],
  species: null,
  ...over,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any) as any

const body = () => document.body
const buttonOf = (label: string) => Array.from(body().querySelectorAll('button')).find(b => b.textContent?.trim() === label) as HTMLButtonElement | undefined
const header = (over: Record<string, unknown> = {}) =>
  mountSuspended(DashboardHeaderSection, { props: { characterSheet: sheet(over), isResting: false, combatMode: false, roll: () => 0 } })
const openLongRest = (wrapper: Awaited<ReturnType<typeof header>>) =>
  wrapper.findAll('button').find(b => b.text() === 'Repos long')!.trigger('click')

describe('repos long — confirmation', () => {
  it('ne part pas au premier clic ; la confirmation le déclenche', async () => {
    const wrapper = await header()

    await openLongRest(wrapper)
    await vi.waitFor(() => expect(body().textContent).toContain('Terminer un repos long ?'))
    expect(wrapper.emitted('longRest')).toBeUndefined()

    buttonOf('Terminer le repos long')!.click()
    expect(wrapper.emitted('longRest')).toEqual([[true]])
  })

  it('sans épuisement, aucune case « mangé et bu »', async () => {
    const wrapper = await header()
    await openLongRest(wrapper)
    await vi.waitFor(() => expect(body().textContent).toContain('Terminer un repos long ?'))
    expect(body().textContent).not.toContain('mangé et bu')
    buttonOf('Annuler')!.click()
  })

  it('épuisé : la case est cochée par défaut, et la décocher envoie « pas mangé »', async () => {
    const wrapper = await header({ exhaustionLevel: 3 })

    await openLongRest(wrapper)
    await vi.waitFor(() => expect(body().textContent).toContain('du niveau 3 au niveau 2'))
    body().querySelector<HTMLButtonElement>('button[role="checkbox"]')!.click()
    await vi.waitFor(() => expect(body().querySelector('button[role="checkbox"]')?.getAttribute('aria-checked')).toBe('false'))
    buttonOf('Terminer le repos long')!.click()

    expect(wrapper.emitted('longRest')).toEqual([[false]])
  })

  it('annuler n\'envoie rien', async () => {
    const wrapper = await header()
    await openLongRest(wrapper)
    await vi.waitFor(() => expect(buttonOf('Annuler')).toBeDefined())
    buttonOf('Annuler')!.click()
    expect(wrapper.emitted('longRest')).toBeUndefined()
  })
})

describe('suppression d\'un objet — confirmation', () => {
  it('l\'objet reste tant qu\'on n\'a pas confirmé', async () => {
    const wrapper = await mountSuspended(InventorySection, { props: { characterSheet: sheet() } })
    await vi.waitFor(() => expect(wrapper.text()).toContain('Équipement (1)'))
    const tab = wrapper.findAll('[role="tab"]').find(t => t.text().includes('Équip'))!
    await tab.trigger('mousedown')
    await tab.trigger('click')
    await vi.waitFor(() => expect(wrapper.text()).toContain('Corde de chanvre'))

    const trash = Array.from(wrapper.element.querySelectorAll('button')).find(b => b.querySelector('[class*="trash"]'))!
    trash.click()
    await vi.waitFor(() => expect(body().textContent).toContain('Supprimer cet objet ?'))
    expect(body().textContent).toContain('Corde de chanvre quitte l\'inventaire')
    expect(deletions).toEqual([])

    buttonOf('Supprimer')!.click()
    await vi.waitFor(() => expect(deletions).toEqual(['1']))
  })
})
