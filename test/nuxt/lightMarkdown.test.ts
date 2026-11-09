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

  it('rend un tableau avec son en-tête, et le HTML d\'une cellule reste du texte', async () => {
    const wrapper = await mountSuspended(LightMarkdown, {
      props: { source: 'Avant.\n\n| Taille | PV |\n| --- | --- |\n| **TP** | 20 |\n| P | <b>25</b> |' },
    })
    expect(wrapper.findAll('th').map(th => th.text())).toEqual(['Taille', 'PV'])
    expect(wrapper.findAll('tbody tr').map(tr => tr.findAll('td').map(td => td.text()))).toEqual([['TP', '20'], ['P', '<b>25</b>']])
    expect(wrapper.find('td span.font-semibold').text()).toBe('TP')
    expect(wrapper.find('td b').exists()).toBe(false)
  })

  it('n\'interprète pas le HTML : il s\'affiche comme du texte', async () => {
    const wrapper = await mountSuspended(LightMarkdown, { props: { source: '<img src=x onerror=alert(1)>' } })
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('<img src=x onerror=alert(1)>')
  })
})
