import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import DsRollToast from '../../app/components/ds/DsRollToast.vue'
import DsSaveIndicator from '../../app/components/ds/DsSaveIndicator.vue'
import DsNavItem from '../../app/components/ds/DsNavItem.vue'
import DsCategoryTabs from '../../app/components/ds/DsCategoryTabs.vue'
import type { DiceRoll } from '../../app/composables/useDiceRoller'

const roll = (over: Partial<DiceRoll> = {}): DiceRoll => ({
  id: 1,
  at: 0,
  label: 'Attaque — Rapière',
  rolls: [14],
  natural: 14,
  modifier: 5,
  result: 19,
  isCrit: false,
  isFumble: false,
  replay: { label: 'Attaque — Rapière', modifier: 5, sides: 20, count: 1, options: {} },
  ...over,
})

describe('notification de jet', () => {
  it('libellé, total, dés et modificateur', async () => {
    const wrapper = await mountSuspended(DsRollToast, { props: { roll: roll() } })

    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.text()).toContain('Attaque — Rapière')
    expect(wrapper.text()).toContain('19')
    expect(wrapper.text()).toContain('14 +5')
  })

  it('un critique et un échec critique se nomment en entier', async () => {
    const crit = await mountSuspended(DsRollToast, { props: { roll: roll({ isCrit: true, natural: 20, rolls: [20], result: 25 }) } })
    expect(crit.text()).toContain('Critique')

    const fumble = await mountSuspended(DsRollToast, { props: { roll: roll({ isFumble: true, natural: 1, rolls: [1], result: 6 }) } })
    expect(fumble.text()).toContain('Échec critique')
  })

  it('reprend les notes du jet (avantage, échec automatique)', async () => {
    const wrapper = await mountSuspended(DsRollToast, {
      props: { roll: roll({ rolls: [14, 3], keptIndex: 0, mode: 'advantage', advantage: ['Bénédiction'] }) },
    })
    expect(wrapper.text()).toContain('Avantage (Bénédiction)')
    expect(wrapper.text()).toContain('14 (3) +5')
  })
})

describe('indicateur de sauvegarde', () => {
  it.each([
    ['saved', 0, 'Enregistré', 'Sauvegarde : enregistré'],
    ['saving', 0, 'En cours', 'Sauvegarde : en cours'],
    ['pending', 3, '3en attente', 'Sauvegarde : 3 en attente'],
    ['offline', 3, 'Hors ligne3 en attente', 'Sauvegarde : hors ligne, 3 en attente'],
    ['offline', 0, 'Hors ligne', 'Sauvegarde : hors ligne'],
    ['failed', 0, 'Échec', 'Sauvegarde : échec'],
    ['conflict', 1, 'Conflit', 'Sauvegarde : conflit, 1 en attente'],
  ] as const)('%s (%i en attente)', async (state, pending, text, label) => {
    const wrapper = await mountSuspended(DsSaveIndicator, { props: { state, pending } })

    expect(wrapper.text().replace(/\s+/g, '')).toBe(text.replace(/\s+/g, ''))
    expect(wrapper.attributes('aria-label')).toBe(label)
  })

  it('se touche pour ouvrir le détail', async () => {
    const onClick = vi.fn()
    const wrapper = await mountSuspended(DsSaveIndicator, { props: { state: 'failed' }, attrs: { onClick } })
    await wrapper.trigger('click')
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

describe('navigation', () => {
  it('onglet actif marqué comme page courante ; lien quand une route est donnée', async () => {
    const active = await mountSuspended(DsNavItem, { props: { label: 'En jeu', active: true } })
    expect(active.element.tagName).toBe('BUTTON')
    expect(active.attributes('aria-current')).toBe('page')
    expect(active.text()).toBe('En jeu')

    const link = await mountSuspended(DsNavItem, { props: { label: 'Personnages', to: '/characters' } })
    expect(link.element.tagName).toBe('A')
    expect(link.attributes('href')).toBe('/characters')
    expect(link.attributes('aria-current')).toBeUndefined()
  })

  it('filtres de catégorie : onglets avec compteur', async () => {
    const options = [
      { value: 'all', label: 'Tout', count: 12 },
      { value: 'spells', label: 'Sorts', count: 6 },
    ]
    const wrapper = await mountSuspended(DsCategoryTabs, { props: { options, label: 'Catégories', modelValue: 'all' } })
    const tabs = wrapper.findAll('[role="tab"]')

    expect(tabs.map(t => t.attributes('aria-selected'))).toEqual(['true', 'false'])
    expect(tabs[1]!.text()).toBe('Sorts 6')
    await tabs[1]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['spells']])
  })
})
