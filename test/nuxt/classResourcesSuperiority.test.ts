import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import ClassResourcesSection from '../../app/components/character_sheet/ClassResourcesSection.vue'
import { guerrierSubclasses } from '../../server/db/seeds/data/guerrier'
import { abilityScores, classSheet, featureRow, named } from '../fixtures/classSheet'

// Maître de guerre sur la fiche : les dés de supériorité, leur taille, le DD de manœuvre et les manœuvres qui les dépensent.

const SHEET_ID = 9202
const FIGHTER = 5
const SUBCLASS = 50

registerEndpoint(`/api/character_sheets/${SHEET_ID}/inventory`, () => [])
registerEndpoint(`/api/character_sheets/${SHEET_ID}/backgrounds`, () => [])
registerEndpoint(`/api/character_sheets/${SHEET_ID}/spells`, () => [])
registerEndpoint(`/api/character_sheets/${SHEET_ID}/features`, { method: 'PUT', handler: () => ({ success: true }) })

const battleMaster = guerrierSubclasses.find(s => s.name === 'Maître de guerre')!.features

const subclassRow = (name: string, patch: { currentUses?: number } = {}) => {
  const row = featureRow(named(battleMaster, name), FIGHTER, patch)
  Object.assign(row.feature, { featureType: 'subclass_feature', classId: null, subclassId: SUBCLASS })
  return row
}

const sheet = (level: number, scores: Record<string, number>, spent = 0) => classSheet(SHEET_ID, 'Guerrier', FIGHTER, level, [
  subclassRow('Supériorité martiale', { currentUses: spent }),
  subclassRow('Parade'),
  subclassRow('Riposte'),
], {
  baseAbilityScores: abilityScores(scores),
  classes: [{ classId: FIGHTER, level, isMain: true, class: { name: 'Guerrier' }, subclass: { id: SUBCLASS, name: 'Maître de guerre' } }],
})

const mount = (characterSheet: ReturnType<typeof sheet>) =>
  mountSuspended(ClassResourcesSection, { props: { characterSheet }, global: { provide: { spellSlots: ref({ spellcasting: {}, pact_magic: {} }) } } })

const buttonWith = (wrapper: Awaited<ReturnType<typeof mount>>, text: string) =>
  wrapper.findAll('button').find(b => b.text().includes(text))!

describe('ClassResourcesSection — dés de supériorité', () => {
  it('niveau 7 : cinq dés d8, DD de manœuvre sur la meilleure de Force et de Dextérité', async () => {
    const wrapper = await mount(sheet(7, { str: 10, dex: 18 }))

    expect(wrapper.text()).toContain('Supériorité martiale')
    expect(wrapper.text()).toContain('5/5')
    expect(wrapper.text()).toContain('d8')
    expect(wrapper.text()).toContain('DD 15') // 8 + maîtrise 3 + Dextérité +4
    expect(wrapper.text()).toContain('Repos court')
  })

  it('le dé devient un d10 au niveau 10 et un d12 au niveau 18 ; le DD suit la Force quand elle est meilleure', async () => {
    const ten = await mount(sheet(10, { str: 20, dex: 10 }))
    expect(ten.text()).toContain('d10')
    expect(ten.text()).toContain('DD 17') // 8 + maîtrise 4 + Force +5

    const eighteen = await mount(sheet(18, { str: 10, dex: 10 }, 1)) // un dé déjà dépensé
    expect(eighteen.text()).toContain('d12')
    expect(eighteen.text()).toMatch(/5\/6/)
  })

  it('chaque manœuvre connue dépense un dé, et plus aucune n\'est possible sans dé', async () => {
    const cs = sheet(3, {})
    const wrapper = await mount(cs)

    expect(wrapper.text()).toContain('Manœuvres')
    await buttonWith(wrapper, 'Parade').trigger('click')
    await new Promise(r => setTimeout(r, 20))
    expect(cs.features[0].currentUses).toBe(1)

    const empty = await mount(sheet(3, {}, 4))
    expect(buttonWith(empty, 'Riposte').attributes('disabled')).toBeDefined()
  })
})
