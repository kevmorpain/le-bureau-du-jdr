import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { DOMWrapper } from '@vue/test-utils'
import DsHpBar from '../../app/components/ds/DsHpBar.vue'
import DsCostTag from '../../app/components/ds/DsCostTag.vue'
import DsBadge from '../../app/components/ds/DsBadge.vue'
import DsFrame from '../../app/components/ds/DsFrame.vue'
import DsButton from '../../app/components/ds/DsButton.vue'
import DsCornerButton from '../../app/components/ds/DsCornerButton.vue'
import DsLinkButton from '../../app/components/ds/DsLinkButton.vue'
import DsBlock from '../../app/components/ds/DsBlock.vue'
import DsShield from '../../app/components/ds/DsShield.vue'
import DsIcon from '../../app/components/ds/DsIcon.vue'

type Segment = { kind: string | undefined, left: string, width: string }

const segmentsOf = (wrapper: { findAll: (selector: string) => DOMWrapper<Element>[] }): Segment[] =>
  wrapper.findAll('[data-segment]').map((s) => {
    const style = (s.element as HTMLElement).style
    return { kind: s.attributes('data-segment'), left: style.left, width: style.width }
  })

describe('barre de PV', () => {
  it('sans aperçu : PV puis temporaires, à l’échelle des PV max et des temporaires', async () => {
    const wrapper = await mountSuspended(DsHpBar, { props: { max: 90, current: 45, temp: 10 } })

    expect(segmentsOf(wrapper)).toEqual([
      { kind: 'hp', left: '0%', width: '45%' },
      { kind: 'temp', left: '45%', width: '10%' },
    ])
    const meter = wrapper.get('[role="meter"]')
    expect(meter.attributes('aria-valuenow')).toBe('45')
    expect(meter.attributes('aria-valuetext')).toBe('45 sur 90, 10 temporaires')
  })

  it('aperçu de dégâts : les temporaires absorbent, les PV perdus sont hachurés', async () => {
    const wrapper = await mountSuspended(DsHpBar, {
      props: { max: 80, current: 70, temp: 20, preview: { current: 60, temp: 0 }, legend: true },
    })

    expect(segmentsOf(wrapper)).toEqual([
      { kind: 'hp', left: '0%', width: '60%' },
      { kind: 'lost', left: '60%', width: '10%' },
      { kind: 'absorbed', left: '70%', width: '20%' },
    ])
    expect(wrapper.text()).toContain('perdus')
    expect(wrapper.text()).toContain('absorbés')
    expect(wrapper.text()).not.toContain('récupérés')
    expect(wrapper.get('[role="meter"]').attributes('aria-valuetext')).toBe('60 sur 80 (actuellement 70)')
  })

  it('aperçu de soins : les PV récupérés suivent les PV actuels', async () => {
    const wrapper = await mountSuspended(DsHpBar, { props: { max: 50, current: 20, preview: { current: 35, temp: 0 } } })

    expect(segmentsOf(wrapper)).toEqual([
      { kind: 'hp', left: '0%', width: '40%' },
      { kind: 'recovered', left: '40%', width: '30%' },
    ])
  })
})

describe('étiquettes', () => {
  it('coût : la lettre, et le nom complet pour les lecteurs d’écran', async () => {
    const action = await mountSuspended(DsCostTag, { props: { cost: 'action' } })
    const bonus = await mountSuspended(DsCostTag, { props: { cost: 'bonus' } })
    const reaction = await mountSuspended(DsCostTag, { props: { cost: 'reaction' } })

    expect([action, bonus, reaction].map(w => w.text())).toEqual(['A', 'B', 'R'])
    expect([action, bonus, reaction].map(w => w.attributes('aria-label'))).toEqual(['Action', 'Action bonus', 'Réaction'])
  })

  it('badge : libellé en entier', async () => {
    const wrapper = await mountSuspended(DsBadge, { props: { label: 'Équipé', variant: 'equipped' } })
    expect(wrapper.text()).toBe('Équipé')
  })

  it('badge à bord seul : bord en deux couches, jamais un trait intérieur que la découpe rognerait', async () => {
    const wrapper = await mountSuspended(DsBadge, { props: { label: 'Rare', surface: 'panel-raised' } })
    const outer = wrapper.element as HTMLElement
    const inner = outer.firstElementChild as HTMLElement

    expect(outer.classList).toContain('ds-bevel')
    expect(outer.classList).toContain('badge--on-panel-raised')
    expect(inner.classList).toContain('ds-fill')
  })
})

describe('formes', () => {
  it('cadre biseauté en deux couches : bord dessous, fond dessus, même découpe', async () => {
    const wrapper = await mountSuspended(DsFrame, { props: { shape: 'octagon' }, slots: { default: () => 'Contenu' } })
    const outer = wrapper.element as HTMLElement
    const inner = outer.firstElementChild as HTMLElement

    expect([...outer.classList]).toEqual(expect.arrayContaining(['ds-bevel', 'ds-shape-octagon', 'frame--edge-gold', 'frame--fill-panel']))
    expect(inner.classList).toContain('ds-fill')
    expect(wrapper.text()).toBe('Contenu')
  })

  it('forme et teintes se choisissent par props', async () => {
    const wrapper = await mountSuspended(DsFrame, { props: { shape: 'stepped', tone: 'gold-dim', fill: 'bg', padded: false } })
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['ds-shape-stepped', 'frame--edge-gold-dim', 'frame--fill-bg']))
    expect(wrapper.get('.ds-fill').classes()).not.toContain('frame__fill--padded')
  })

  it('bloc à ruban : le ruban nomme la section', async () => {
    const wrapper = await mountSuspended(DsBlock, { props: { ribbon: 'Ce tour' }, slots: { default: () => 'Corps' } })
    expect(wrapper.get('section').attributes('aria-label')).toBe('Ce tour')
    expect(wrapper.text()).toContain('Ce tour')
  })

  it('bouclier : libellé et valeur lus ensemble', async () => {
    const wrapper = await mountSuspended(DsShield, { props: { label: 'CA', value: 14 } })
    expect(wrapper.attributes('aria-label')).toBe('CA 14')
  })
})

describe('boutons', () => {
  it('bouton à pointes : libellé, détail, et clic', async () => {
    const onClick = vi.fn()
    const wrapper = await mountSuspended(DsButton, { props: { label: 'Lancer', detail: 'Pacte · niv. 5' }, attrs: { onClick } })

    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.text()).toContain('Lancer')
    expect(wrapper.text()).toContain('Pacte · niv. 5')
    await wrapper.trigger('click')
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('destructif : variante danger, en deux couches', async () => {
    const wrapper = await mountSuspended(DsButton, { props: { label: 'Supprimer', variant: 'danger' } })
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['ds-bevel', 'ds-shape-point', 'button--danger']))
    expect(wrapper.find('b').exists()).toBe(false)
  })

  it('bouton de coin : toujours nommé ; en bascule, son état est exposé', async () => {
    const close = await mountSuspended(DsCornerButton, { props: { label: 'Fermer' } })
    expect(close.attributes('aria-label')).toBe('Fermer')
    expect(close.attributes('aria-pressed')).toBeUndefined()

    const favorite = await mountSuspended(DsCornerButton, { props: { label: 'Favori', icon: 'favorite', toggle: true, active: true } })
    expect(favorite.attributes('aria-pressed')).toBe('true')
    expect(favorite.text()).toBe('★')
  })

  it('action légère : signe plus optionnel', async () => {
    const wrapper = await mountSuspended(DsLinkButton, { props: { label: 'Ajouter un objet', plus: true } })
    expect(wrapper.text()).toBe('+Ajouter un objet')
  })
})

describe('icônes', () => {
  it('décoratives par défaut, nommées quand un libellé est donné', async () => {
    const decorative = await mountSuspended(DsIcon, { props: { name: 'spell' } })
    expect(decorative.attributes('aria-hidden')).toBe('true')

    const named = await mountSuspended(DsIcon, { props: { name: 'ritual', label: 'Rituel' } })
    expect(named.attributes('role')).toBe('img')
    expect(named.attributes('aria-label')).toBe('Rituel')
  })
})
