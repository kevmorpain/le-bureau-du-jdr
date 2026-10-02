import { describe, it, expect } from 'vitest'
import { readBody } from 'h3'
import { ref } from 'vue'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import ClassResourcesSection from '../../app/components/character_sheet/ClassResourcesSection.vue'
import { barbareFeatures } from '../../server/db/seeds/data/barbare'
import { ensorceleurFeatures } from '../../server/db/seeds/data/ensorceleur'
import { ensorceleurMetamagicFeatures } from '../../server/db/seeds/data/ensorceleur_metamagic'
import { moineFeatures } from '../../server/db/seeds/data/moine'
import { abilityScores, classSheet, featureRow, named } from '../fixtures/classSheet'

const SHEET_ID = 9201

registerEndpoint(`/api/character_sheets/${SHEET_ID}/inventory`, () => [])
registerEndpoint(`/api/character_sheets/${SHEET_ID}/proficiency-overrides`, () => [])
registerEndpoint(`/api/character_sheets/${SHEET_ID}/spells`, () => [])
registerEndpoint('/api/backgrounds', () => [])
const puts: unknown[] = []
registerEndpoint(`/api/character_sheets/${SHEET_ID}/features`, {
  method: 'PUT',
  handler: async (event) => {
    puts.push(await readBody(event))
    return { success: true }
  },
})

const slotsOf = (levels: Record<number, number>) => ref({
  spellcasting: Object.fromEntries(Object.entries(levels).map(([l, n]) => [l, { max: n, current: n }])),
  pact_magic: {},
})

const mount = (characterSheet: ReturnType<typeof classSheet>, spellSlots = slotsOf({})) =>
  mountSuspended(ClassResourcesSection, { props: { characterSheet }, global: { provide: { spellSlots } } })

const buttonWith = (wrapper: Awaited<ReturnType<typeof mount>>, text: string) =>
  wrapper.findAll('button').find(b => b.text().includes(text))!

describe('ClassResourcesSection — Rage', () => {
  it('affiche les utilisations du niveau (4 rages au niveau 9) et active la rage en dépensant une utilisation', async () => {
    puts.length = 0
    const cs = classSheet(SHEET_ID, 'Barbare', 1, 9, [featureRow(named(barbareFeatures, 'Rage'), 1)])
    const wrapper = await mount(cs)
    expect(wrapper.text()).toContain('Rage')
    expect(wrapper.text()).toContain('4/4')

    await buttonWith(wrapper, 'Activer Rage').trigger('click')
    await new Promise(r => setTimeout(r, 20))

    expect(cs.features[0].active).toBe(true)
    expect(cs.features[0].currentUses).toBe(1)
    expect(wrapper.text()).toContain('3/4')
    expect(wrapper.text()).toContain('Résistance Contondant')
    expect(wrapper.text()).toContain('dégâts +3')
    expect(puts).toEqual(expect.arrayContaining([[{ featureId: 1, currentUses: 1 }], [{ featureId: 1, active: true }]]))
  })

  it('la rage est refusée quand il ne reste plus d\'utilisation', async () => {
    const cs = classSheet(SHEET_ID, 'Barbare', 1, 1, [featureRow(named(barbareFeatures, 'Rage'), 1, { currentUses: 2 })])
    const wrapper = await mount(cs)
    await buttonWith(wrapper, 'Activer Rage').trigger('click')
    await new Promise(r => setTimeout(r, 20))
    expect(cs.features[0].active).toBe(false)
    expect(cs.features[0].currentUses).toBe(2)
  })

  it('au niveau 20 : utilisations illimitées, l\'activation ne dépense rien', async () => {
    const cs = classSheet(SHEET_ID, 'Barbare', 1, 20, [featureRow(named(barbareFeatures, 'Rage'), 1)])
    const wrapper = await mount(cs)
    expect(wrapper.text()).toContain('illimitées')
    await buttonWith(wrapper, 'Activer Rage').trigger('click')
    await new Promise(r => setTimeout(r, 20))
    expect(cs.features[0].active).toBe(true)
    expect(cs.features[0].currentUses).toBe(0)
  })
})

describe('ClassResourcesSection — Ki', () => {
  it('niveau de moine = points de ki ; chaque usage décrit dépense son coût', async () => {
    const cs = classSheet(SHEET_ID, 'Moine', 2, 5, [featureRow(named(moineFeatures, 'Ki'), 2)], {
      baseAbilityScores: abilityScores({ wis: 16 }),
    })
    const wrapper = await mount(cs)
    expect(wrapper.text()).toContain('5')
    expect(wrapper.text()).toContain('/ 5')
    expect(wrapper.text()).toContain('DD 14') // 8 + maîtrise 3 + Sagesse +3

    await buttonWith(wrapper, 'Frappe étourdissante').trigger('click')
    await new Promise(r => setTimeout(r, 20))
    expect(cs.features[0].currentUses).toBe(1)
  })

  it('dépense impossible quand il ne reste pas assez de points', async () => {
    const cs = classSheet(SHEET_ID, 'Moine', 2, 5, [featureRow(named(moineFeatures, 'Ki'), 2, { currentUses: 5 })])
    const wrapper = await mount(cs)
    expect(buttonWith(wrapper, 'Déluge de coups').attributes('disabled')).toBeDefined()
  })
})

describe('ClassResourcesSection — Points de sorcellerie', () => {
  const sorcerer = (spent = 0) => classSheet(SHEET_ID, 'Ensorceleur', 5, 5, [
    featureRow(named(ensorceleurFeatures, 'Source de magie'), 5, { currentUses: spent }),
    featureRow(named(ensorceleurMetamagicFeatures, 'Sort subtil'), 5),
    featureRow(named(ensorceleurMetamagicFeatures, 'Sort jumeau'), 5),
  ])

  it('propose les options de Métamagie choisies avec leur coût', async () => {
    const wrapper = await mount(sorcerer())
    expect(wrapper.text()).toContain('Sort subtil (1)')
    expect(wrapper.text()).toContain('Sort jumeau (= niv. 1)')
    expect(wrapper.text()).not.toContain('Sort accéléré')
  })

  it('une option de Métamagie dépense ses points', async () => {
    const cs = sorcerer()
    const wrapper = await mount(cs)
    await buttonWith(wrapper, 'Sort subtil').trigger('click')
    await new Promise(r => setTimeout(r, 20))
    expect(cs.features[0].currentUses).toBe(1)
  })

  it('créer un emplacement de niveau 2 coûte 3 points et ajoute un emplacement créé', async () => {
    const cs = sorcerer()
    const slots = slotsOf({ 1: 4, 2: 3 })
    const wrapper = await mount(cs, slots)
    await buttonWith(wrapper, 'Niv. 2 (−3)').trigger('click')
    await new Promise(r => setTimeout(r, 20))
    expect(cs.features[0].currentUses).toBe(3)
    expect(slots.value.spellcasting[2]).toEqual({ max: 4, current: 4, created: 1 })
  })

  it('convertir un emplacement de niveau 2 rend 2 points, sans dépasser le maximum', async () => {
    const cs = sorcerer(1)
    const slots = slotsOf({ 2: 3 })
    const wrapper = await mount(cs, slots)
    await buttonWith(wrapper, 'Niv. 2 (+2)').trigger('click')
    await new Promise(r => setTimeout(r, 20))
    expect(slots.value.spellcasting[2]!.current).toBe(2)
    expect(cs.features[0].currentUses).toBe(0) // 1 dépensé − 2 → plancher à 0
  })

  it('créer un emplacement est impossible sans assez de points (2 restants : niveau 1 seulement)', async () => {
    const cs = sorcerer(3)
    const wrapper = await mount(cs, slotsOf({ 1: 4 }))
    expect(buttonWith(wrapper, 'Niv. 3 (−5)').attributes('disabled')).toBeDefined()
    expect(buttonWith(wrapper, 'Niv. 1 (−2)').attributes('disabled')).toBeUndefined()
  })
})
