import { describe, it, expect } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import SpellsPage from '../../app/pages/spells/index.vue'

// U8 : le catalogue de sorts se cherche par nom, sans casse ni accents, et se combine aux autres filtres.

const spell = (id: number, name: string, level: number) => ({ id, name, level, concentration: false, ritual: false, castingTime: '1 action', components: ['V'] })

registerEndpoint('/api/spells', () => [
  spell(1, 'Boule de feu', 3),
  spell(2, 'Détection de la magie', 1),
  spell(3, 'Rayon de givre', 0),
])

const SpellList = { props: ['spells'], template: '<ul><li v-for="s in spells" :key="s.id">{{ s.name }}</li></ul>' }

describe('catalogue de sorts — recherche par nom', () => {
  it('filtre par nom, accents et casse ignorés', async () => {
    const wrapper = await mountSuspended(SpellsPage, { global: { stubs: { CardList: SpellList, TableList: SpellList } } })
    await flushPromises()
    expect(wrapper.findAll('li').map(li => li.text())).toEqual(['Boule de feu', 'Détection de la magie', 'Rayon de givre'])

    await wrapper.find('input[placeholder="Rechercher un sort"]').setValue('DETECTION')
    await flushPromises()
    expect(wrapper.findAll('li').map(li => li.text())).toEqual(['Détection de la magie'])

    await wrapper.find('input[placeholder="Rechercher un sort"]').setValue('')
    await flushPromises()
    expect(wrapper.findAll('li')).toHaveLength(3)
  })
})
