import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MagicEffectEditor from '../../app/components/character_sheet/MagicEffectEditor.vue'

// L'éditeur d'objet doit rendre et réémettre les formes de l'union `Effect` lues par la fiche
// (`ability_increase.max`, `ability_score_set.score`) : une forme divergente y serait silencieusement morte.

describe('MagicEffectEditor — effets de caractéristique', () => {
  it('rend le maximum d\'une augmentation et le score d\'une caractéristique fixée', async () => {
    const wrapper = await mountSuspended(MagicEffectEditor, {
      props: {
        modelValue: [
          { type: 'ability_increase', value: { ability: 'con', amount: 2, max: 20 } },
          { type: 'ability_score_set', value: { ability: 'str', score: 19 } },
        ],
      },
    })

    expect(wrapper.text()).toContain('Maximum')
    expect(wrapper.text()).toContain('Score fixé à')
    const values = wrapper.findAll('input[type="number"]').map(i => (i.element as HTMLInputElement).value)
    expect(values).toEqual(['2', '20', '19'])
  })

  it('réémet la forme de l\'union quand un champ change', async () => {
    const wrapper = await mountSuspended(MagicEffectEditor, {
      props: { modelValue: [{ type: 'ability_score_set', value: { ability: 'str', score: 19 } }] },
    })

    await wrapper.find('input[type="number"]').setValue('21')

    const emitted = wrapper.emitted('update:modelValue')!.at(-1)![0]
    expect(emitted).toEqual([{ type: 'ability_score_set', value: { ability: 'str', score: 21 } }])
  })
})
