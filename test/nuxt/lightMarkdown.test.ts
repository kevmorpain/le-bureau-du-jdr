import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import LightMarkdown from '../../app/components/LightMarkdown.vue'

describe('LightMarkdown', () => {
  it('rend paragraphes, puces et gras en balises sûres', async () => {
    const wrapper = await mountSuspended(LightMarkdown, {
      props: { source: 'Intro.\n\n- **Un** : a\n- Deux\n\n<b>pas du html</b>' },
    })
    expect(wrapper.findAll('p')).toHaveLength(2)
    expect(wrapper.findAll('li').map(li => li.text())).toEqual(['Un : a', 'Deux'])
    expect(wrapper.find('li span.font-semibold').text()).toBe('Un')
  })

  it('n\'interprète pas le HTML : il s\'affiche comme du texte', async () => {
    const wrapper = await mountSuspended(LightMarkdown, { props: { source: '<img src=x onerror=alert(1)>' } })
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('<img src=x onerror=alert(1)>')
  })
})
