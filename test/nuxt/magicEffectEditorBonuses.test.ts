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

  it('propose un bonus de vitesse sous la forme lue par la fiche et le réémet', async () => {
    const wrapper = await mountSuspended(MagicEffectEditor, {
      props: { modelValue: [], types: ['speed_bonus'] },
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toEqual([{ type: 'speed_bonus', value: { amount: { op: 'fixed', value: 3 } } }])

    await wrapper.find('input[type="number"]').setValue('6')
    expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toEqual([{ type: 'speed_bonus', value: { amount: { op: 'fixed', value: 6 } } }])
  })

  it('propose un bonus d\'arme (toutes les armes, +1) et un avantage à condition libre', async () => {
    for (const [type, value] of [
      ['weapon_attack_bonus', { amount: 1, weapons: 'all' }],
      ['weapon_damage_bonus', { amount: 1, weapons: 'all' }],
      ['advantage', { rollType: 'saving_throw', ability: 'all', condition: '' }],
    ] as const) {
      const wrapper = await mountSuspended(MagicEffectEditor, { props: { modelValue: [], types: [type] } })
      await wrapper.find('button').trigger('click')
      expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toEqual([{ type, value }])
    }
  })

  it('saisit la condition d\'un avantage en texte libre', async () => {
    const wrapper = await mountSuspended(MagicEffectEditor, {
      props: { modelValue: [{ type: 'advantage', value: { rollType: 'saving_throw', ability: 'all', condition: '' } }] },
    })
    await wrapper.find('input[type="text"]').setValue('contre l\'effroi')
    expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toEqual([
      { type: 'advantage', value: { rollType: 'saving_throw', ability: 'all', condition: 'contre l\'effroi' } },
    ])
  })

  it('propose les vitesses de nage, d\'escalade et de creusement', async () => {
    for (const type of ['swimming_speed', 'climbing_speed', 'burrowing_speed'] as const) {
      const wrapper = await mountSuspended(MagicEffectEditor, { props: { modelValue: [], types: [type] } })
      await wrapper.find('button').trigger('click')
      expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toEqual([{ type, value: 9 }])
    }
  })

  it('chaque type d\'effet temporaire a un formulaire dans l\'éditeur', async () => {
    for (const type of TEMPORARY_EFFECT_TYPES) {
      const wrapper = await mountSuspended(MagicEffectEditor, { props: { modelValue: [], types: [type] } })
      await wrapper.find('button').trigger('click')
      expect(wrapper.findAll('label').length, type).toBeGreaterThan(0)
    }
  })
})
