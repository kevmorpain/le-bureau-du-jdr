import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MagicEffectEditor from '../../app/components/character_sheet/MagicEffectEditor.vue'

// Dégâts supplémentaires d'un objet : l'éditeur écrit la forme que lit le Mode Combat (`weapon_damage_dice`).

describe('MagicEffectEditor — dés de dégâts supplémentaires', () => {
  it('ajoute 1d6 de feu pour l\'arme, puis réémet les dés saisis', async () => {
    const wrapper = await mountSuspended(MagicEffectEditor, { props: { modelValue: [], types: ['weapon_damage_dice'] } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toEqual([{
      type: 'weapon_damage_dice',
      value: { name: 'Dégâts supplémentaires', dice: { op: 'fixed', value: 1 }, sides: 6, damageType: 'fire', weapons: 'all', limit: 'each_hit' },
    }])

    const [count, sides] = wrapper.findAll('input[type="number"]')
    await count!.setValue('2')
    await sides!.setValue('8')
    expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toMatchObject([{ value: { dice: { op: 'fixed', value: 2 }, sides: 8 } }])
  })

  it('ne propose ces dés que sur une arme', async () => {
    const offered = async (weapon: boolean) => {
      const wrapper = await mountSuspended(MagicEffectEditor, {
        props: { modelValue: [{ type: 'armor_class_bonus', value: { amount: 1 } }], weapon },
      })
      const items = wrapper.findComponent({ name: 'USelect' }).props('items') as { value: string }[]
      return items.map(i => i.value)
    }
    expect(await offered(true)).toContain('weapon_damage_dice')
    expect(await offered(false)).not.toContain('weapon_damage_dice')
  })
})
