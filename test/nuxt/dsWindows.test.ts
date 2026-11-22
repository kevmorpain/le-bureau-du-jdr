import { describe, it, expect, vi, afterEach } from 'vitest'
import { h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import DsModal from '../../app/components/ds/DsModal.vue'
import DsDrawer from '../../app/components/ds/DsDrawer.vue'
import DsConfirmModal from '../../app/components/ds/DsConfirmModal.vue'

const body = () => document.body
const dialog = () => body().querySelector('[role="dialog"]') as HTMLElement | null
const buttonOf = (label: string) =>
  Array.from(body().querySelectorAll('button')).find(b => (b.getAttribute('aria-label') ?? b.textContent?.trim()) === label) as HTMLButtonElement | undefined

const mounted: { unmount: () => void }[] = []
afterEach(() => {
  mounted.splice(0).forEach(w => w.unmount())
})

describe('fenêtre', () => {
  it('titre, barre de modes, corps et pied, dans un vrai dialogue', async () => {
    const wrapper = await mountSuspended(DsModal, {
      props: { open: true, title: 'Repos', description: 'Choisir un repos' },
      slots: {
        modes: () => h('div', 'Repos court · Repos long'),
        default: () => h('p', 'Contenu de la fenêtre'),
        footer: () => h('button', 'Terminer'),
      },
    })
    mounted.push(wrapper)

    await vi.waitFor(() => expect(dialog()).not.toBeNull())
    expect(dialog()!.textContent).toContain('Repos court · Repos long')
    expect(dialog()!.textContent).toContain('Contenu de la fenêtre')
    expect(body().querySelector('h2')?.textContent?.trim()).toBe('Repos')
    expect(buttonOf('Terminer')).toBeDefined()
  })

  it('le bouton de coin ferme la fenêtre', async () => {
    const wrapper = await mountSuspended(DsModal, { props: { open: true, title: 'Repos' } })
    mounted.push(wrapper)

    await vi.waitFor(() => expect(buttonOf('Fermer')).toBeDefined())
    buttonOf('Fermer')!.click()
    await vi.waitFor(() => expect(wrapper.emitted('update:open')).toEqual([[false]]))
  })

  it('une fenêtre non refermable n’a pas de bouton de coin', async () => {
    const wrapper = await mountSuspended(DsModal, { props: { open: true, title: 'États', dismissible: false } })
    mounted.push(wrapper)

    await vi.waitFor(() => expect(dialog()).not.toBeNull())
    expect(buttonOf('Fermer')).toBeUndefined()
  })
})

describe('tiroir', () => {
  it('même anatomie que la fenêtre', async () => {
    const wrapper = await mountSuspended(DsDrawer, {
      props: { open: true, title: 'Maléfice' },
      slots: { default: () => h('p', 'Description du sort') },
    })
    mounted.push(wrapper)

    await vi.waitFor(() => expect(dialog()?.textContent).toContain('Description du sort'))
    expect(body().querySelector('h2')?.textContent?.trim()).toBe('Maléfice')
    expect(buttonOf('Fermer')).toBeDefined()
  })
})

describe('confirmation d’une action destructive', () => {
  it('rappelle ce qui sera perdu ; seule la confirmation déclenche l’action', async () => {
    const wrapper = await mountSuspended(DsConfirmModal, {
      props: { open: true, title: 'Supprimer l’objet ?', confirmLabel: 'Supprimer' },
      slots: { default: () => 'La corde de chanvre sera retirée de l’inventaire.' },
    })
    mounted.push(wrapper)

    await vi.waitFor(() => expect(dialog()?.textContent).toContain('La corde de chanvre sera retirée'))
    buttonOf('Annuler')!.click()
    await vi.waitFor(() => expect(wrapper.emitted('update:open')).toEqual([[false]]))
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('confirmer émet l’action et ferme', async () => {
    const wrapper = await mountSuspended(DsConfirmModal, {
      props: { open: true, title: 'Supprimer l’objet ?', confirmLabel: 'Supprimer' },
    })
    mounted.push(wrapper)

    await vi.waitFor(() => expect(buttonOf('Supprimer')).toBeDefined())
    buttonOf('Supprimer')!.click()
    expect(wrapper.emitted('confirm')).toHaveLength(1)
    await vi.waitFor(() => expect(wrapper.emitted('update:open')).toEqual([[false]]))
  })
})
