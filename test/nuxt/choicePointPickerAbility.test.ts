import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ChoicePointPicker from '../../app/components/character_builder/ChoicePointPicker.vue'

describe('ChoicePointPicker — caractéristique d\'incantation', () => {
  it('nomme le choix et propose les caractéristiques en toutes lettres', async () => {
    const wrapper = await mountSuspended(ChoicePointPicker, {
      props: { kind: 'spellcasting_ability', count: 1, options: ['int', 'wis', 'cha'] },
    })
    expect(wrapper.text()).toContain('Caractéristique d\'incantation')
    for (const label of ['Intelligence', 'Sagesse', 'Charisme']) expect(wrapper.text()).toContain(label)
  })

  it('un clic enregistre la valeur de la caractéristique', async () => {
    const wrapper = await mountSuspended(ChoicePointPicker, {
      props: { kind: 'spellcasting_ability', count: 1, options: ['int', 'wis', 'cha'] },
    })
    await wrapper.findAll('button').find(b => b.text() === 'Sagesse')!.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['wis']])
  })
})
