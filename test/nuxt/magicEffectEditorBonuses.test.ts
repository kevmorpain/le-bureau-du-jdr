import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MagicEffectEditor from '../../app/components/character_sheet/MagicEffectEditor.vue'
import { TEMPORARY_EFFECT_TYPES } from '../../shared/utils/temporary_effects'

// Les bonus de CA et de JS doivent sortir de l'éditeur sous la forme de l'union lue par la fiche.

describe('MagicEffectEditor — bonus de CA et de JS', () => {
  it('ajoute par défaut un bonus de CA', async () => {
    const wrapper = await mountSuspended(MagicEffectEditor, { props: { modelValue: [] } })

    await wrapper.find('button').trigger('click')

    const emitted = wrapper.emitted('update:modelValue')!.at(-1)![0]
    expect(emitted).toEqual([{ type: 'armor_class_bonus', value: { amount: 1 } }])
  })

  it('réémet un malus de JS ciblé', async () => {
    const wrapper = await mountSuspended(MagicEffectEditor, {
      props: { modelValue: [{ type: 'saving_throw_bonus', value: { ability: 'all', amount: 1 } }] },
    })

    await wrapper.find('input[type="number"]').setValue('-2')

    const emitted = wrapper.emitted('update:modelValue')!.at(-1)![0]
    expect(emitted).toEqual([{ type: 'saving_throw_bonus', value: { ability: 'all', amount: -2 } }])
  })

  it('le filtre de types ne propose que les types permis', async () => {
    const wrapper = await mountSuspended(MagicEffectEditor, {
      props: { modelValue: [], types: ['saving_throw_bonus'] },
    })

    await wrapper.find('button').trigger('click')

    const emitted = wrapper.emitted('update:modelValue')!.at(-1)![0]
    expect(emitted).toEqual([{ type: 'saving_throw_bonus', value: { ability: 'all', amount: 1 } }])
  })

  it('chaque type d\'effet temporaire a un formulaire dans l\'éditeur', async () => {
    for (const type of TEMPORARY_EFFECT_TYPES) {
      const wrapper = await mountSuspended(MagicEffectEditor, { props: { modelValue: [], types: [type] } })
      await wrapper.find('button').trigger('click')
      expect(wrapper.findAll('label').length, type).toBeGreaterThan(0)
    }
  })
})
