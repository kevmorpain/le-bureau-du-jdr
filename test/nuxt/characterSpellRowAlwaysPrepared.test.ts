import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import CharacterSpellRow from '../../app/components/character_sheet/CharacterSpellRow.vue'

// Un sort de domaine ou de serment est dérivé, jamais stocké : on ne le (dé)prépare ni ne le retire.

const spell = {
  id: 1,
  name: 'Bénédiction',
  level: 1,
  castingTime: '1 action',
  range: 9,
  duration: '1 minute',
  components: ['V', 'S'],
  concentration: true,
  ritual: false,
  damages: null,
  heal: null,
  dc: null,
}

const mountRow = (alwaysPrepared: boolean) => mountSuspended(CharacterSpellRow, {
  props: {
    spell: spell as never,
    isPrepared: true,
    alwaysPrepared,
    hasSomaticWarning: false,
    characterLevel: 5,
    spellcastingModifier: 3,
  },
  global: { stubs: { UTooltip: { template: '<div><slot /></div>' } } },
})

describe('CharacterSpellRow — sort toujours préparé', () => {
  it('affiche « Toujours préparé » à la place de la case, sans bouton de retrait', async () => {
    const wrapper = await mountRow(true)
    expect(wrapper.text()).toContain('Toujours préparé')
    expect(wrapper.find('[role="checkbox"]').exists()).toBe(false)
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('un sort ordinaire garde sa case « Préparé » et son bouton de retrait', async () => {
    const wrapper = await mountRow(false)
    expect(wrapper.text()).not.toContain('Toujours préparé')
    expect(wrapper.find('[role="checkbox"]').exists()).toBe(true)
  })
})
