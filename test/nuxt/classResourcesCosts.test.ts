import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import ClassResourcesSection from '../../app/components/character_sheet/ClassResourcesSection.vue'
import { clercFeatures, clercSubclasses } from '../../server/db/seeds/data/clerc'
import { elementalDisciplineFeatures } from '../../server/db/seeds/data/elemental_disciplines'
import { moineFeatures, moineSubclasses } from '../../server/db/seeds/data/moine'
import { classSheet, featureRow, named } from '../fixtures/classSheet'

// Les options de Conduit divin et les capacités de ki de sous-classe se paient sur la réserve de la fiche.

const SHEET_ID = 9203
const CLERIC = 3
const MONK = 7
const SUBCLASS = 70

registerEndpoint(`/api/character_sheets/${SHEET_ID}/inventory`, () => [])
registerEndpoint(`/api/character_sheets/${SHEET_ID}/backgrounds`, () => [])
registerEndpoint(`/api/character_sheets/${SHEET_ID}/spells`, () => [])
registerEndpoint(`/api/character_sheets/${SHEET_ID}/features`, { method: 'PUT', handler: () => ({ success: true }) })

const subclassRow = (defs: Parameters<typeof named>[0], name: string, classId: number, patch: { currentUses?: number } = {}) => {
  const row = featureRow(named(defs, name), classId, patch)
  Object.assign(row.feature, { featureType: 'subclass_feature', classId: null, subclassId: SUBCLASS })
  return row
}

const mount = (characterSheet: ReturnType<typeof classSheet>) =>
  mountSuspended(ClassResourcesSection, { props: { characterSheet }, global: { provide: { spellSlots: ref({ spellcasting: {}, pact_magic: {} }) } } })

const buttonWith = (wrapper: Awaited<ReturnType<typeof mount>>, text: string) =>
  wrapper.findAll('button').find(b => b.text().includes(text))!

const lifeDomain = clercSubclasses.find(s => s.name === 'Domaine de la vie')!.features
const openHand = moineSubclasses.find(s => s.name === 'Voie de la paume')!.features

const cleric = (level: number, spent = 0) => classSheet(SHEET_ID, 'Clerc', CLERIC, level, [
  featureRow(named(clercFeatures, 'Conduit divin'), CLERIC, { currentUses: spent }),
  featureRow(named(clercFeatures, 'Renvoi des morts-vivants'), CLERIC),
  subclassRow(lifeDomain, 'Conduit divin : Préservation de la vie', CLERIC),
], {
  classes: [{ classId: CLERIC, level, isMain: true, class: { name: 'Clerc' }, subclass: { id: SUBCLASS, name: 'Domaine de la vie' } }],
})

const monk = (level: number, spent = 0) => classSheet(SHEET_ID, 'Moine', MONK, level, [
  featureRow(named(moineFeatures, 'Ki'), MONK, { currentUses: spent }),
  subclassRow(openHand, 'Paume frémissante', MONK),
  subclassRow(elementalDisciplineFeatures, 'Frappe de cendres', MONK),
], {
  classes: [{ classId: MONK, level, isMain: true, class: { name: 'Moine' }, subclass: { id: SUBCLASS, name: 'Voie de la paume' } }],
})

describe('ClassResourcesSection — Conduit divin', () => {
  it('chaque option dépense une utilisation de la réserve, domaine ou non', async () => {
    const cs = cleric(6)
    const wrapper = await mount(cs)

    expect(wrapper.text()).toContain('Conduit divin')
    expect(wrapper.text()).not.toContain('Manœuvres')
    expect(wrapper.text()).toContain('2/2')

    await buttonWith(wrapper, 'Préservation de la vie').trigger('click')
    await new Promise(r => setTimeout(r, 20))
    expect(cs.features[0].currentUses).toBe(1)

    await buttonWith(wrapper, 'Renvoi des morts-vivants').trigger('click')
    await new Promise(r => setTimeout(r, 20))
    expect(cs.features[0].currentUses).toBe(2)
  })

  it('plus aucune option n\'est possible quand la réserve est vide', async () => {
    const wrapper = await mount(cleric(2, 1))

    expect(buttonWith(wrapper, 'Préservation de la vie').attributes('disabled')).toBeDefined()
    expect(buttonWith(wrapper, 'Renvoi des morts-vivants').attributes('disabled')).toBeDefined()
  })
})

describe('ClassResourcesSection — ki', () => {
  it('une capacité de sous-classe paie son coût en ki, les capacités du Moine suivent son niveau', async () => {
    const cs = monk(18)
    const wrapper = await mount(cs)

    expect(wrapper.text()).toContain('Capacités de ki')
    await buttonWith(wrapper, 'Paume frémissante').trigger('click')
    await new Promise(r => setTimeout(r, 20))
    expect(cs.features[0].currentUses).toBe(3)

    expect(buttonWith(wrapper, 'Âme de diamant')).toBeDefined()
    expect(buttonWith(wrapper, 'Vide immaculé')).toBeDefined()
    expect(buttonWith(wrapper, 'Projection astrale')).toBeDefined()
  })

  it('avant le niveau 14, Âme de diamant et Désertion de l\'âme ne sont pas proposées', async () => {
    const wrapper = await mount(monk(13))

    expect(wrapper.text()).not.toContain('Âme de diamant')
    expect(wrapper.text()).not.toContain('Vide immaculé')
  })

  it('une discipline élémentaire choisie se paie en ki', async () => {
    const cs = monk(6)
    const wrapper = await mount(cs)

    await buttonWith(wrapper, 'Frappe de cendres').trigger('click')
    await new Promise(r => setTimeout(r, 20))
    expect(cs.features[0].currentUses).toBe(2)
  })

  it('Perfection de l\'être rend 4 ki, seulement quand il n\'en reste plus, au niveau 20', async () => {
    const empty = monk(20, 20)
    const wrapper = await mount(empty)
    const regain = buttonWith(wrapper, 'Perfection de l\'être')

    expect(regain.attributes('disabled')).toBeUndefined()
    await regain.trigger('click')
    await new Promise(r => setTimeout(r, 20))
    expect(empty.features[0].currentUses).toBe(16)

    const some = await mount(monk(20, 5))
    expect(buttonWith(some, 'Perfection de l\'être').attributes('disabled')).toBeDefined()
    expect(buttonWith(await mount(monk(19, 19)), 'Perfection de l\'être')).toBeUndefined()
  })
})
