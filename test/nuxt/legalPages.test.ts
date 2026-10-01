import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AppFooter from '../../app/components/AppFooter.vue'
import MentionsLegales from '../../app/pages/mentions-legales.vue'
import Confidentialite from '../../app/pages/confidentialite.vue'
import { CONTACT_EMAIL, HOST } from '../../app/data/legal'

// Garde-fou : un éditeur anonyme doit afficher l'hébergeur (art. 1-1 LCEN) et un contact pour exercer
// les droits RGPD ; le footer rend ces pages accessibles depuis toutes les pages.
describe('pages légales', () => {
  it('le footer lie les deux pages légales', async () => {
    const hrefs = (await mountSuspended(AppFooter)).findAll('a').map(a => a.attributes('href'))

    expect(hrefs).toContain('/mentions-legales')
    expect(hrefs).toContain('/confidentialite')
  })

  it('les mentions légales affichent l\'hébergeur et le contact', async () => {
    const wrapper = await mountSuspended(MentionsLegales)

    expect(wrapper.text()).toContain(HOST.name)
    expect(wrapper.text()).toContain(HOST.address)
    expect(wrapper.find(`a[href="mailto:${CONTACT_EMAIL}"]`).exists()).toBe(true)
  })

  it('la politique de confidentialité affiche le contact et les droits', async () => {
    const wrapper = await mountSuspended(Confidentialite)

    expect(wrapper.find(`a[href="mailto:${CONTACT_EMAIL}"]`).exists()).toBe(true)
    expect(wrapper.text()).toContain('CNIL')
    expect(wrapper.text()).toContain('Cloudflare')
  })
})
