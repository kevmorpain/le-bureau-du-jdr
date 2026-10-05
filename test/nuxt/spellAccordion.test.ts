import { describe, it, expect } from 'vitest'
import { nextTick, ref } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import MagicSection from '../../app/components/character_sheet/MagicSection.vue'
import { spells } from '../../server/db/seeds/data/spells'
import { abilityScores, classSheet } from '../fixtures/classSheet'

// Lire un sort se fait sur la ligne même (accordéon) : faits de fiche, description structurée, lancement et rituel.

const seedSpell = (name: string, id: number) => ({ ...spells.find(s => s.name === name)!, id, school: { name: 'evocation' } })

const characterSpell = (name: string, id: number, isPrepared: boolean, classId: number) => ({
  characterSheetId: 1,
  spellId: id,
  classId,
  isKnown: true,
  isPrepared,
  alwaysPrepared: false,
  source: null,
  spell: seedSpell(name, id),
})

const slots = ref({ spellcasting: { 1: { max: 2, current: 2 }, 3: { max: 2, current: 2 } }, pact_magic: {} })

const mountFor = async (sheetId: number, className: string, classId: number, isPrepared: boolean, ability = 'int') => {
  registerEndpoint(`/api/character_sheets/${sheetId}/spells`, () => [
    characterSpell('Boule de feu', 501, true, classId),
    characterSpell('Détection de la magie', 502, isPrepared, classId),
    characterSpell('Rayon de givre', 503, true, classId),
  ])
  registerEndpoint(`/api/character_sheets/${sheetId}/inventory`, () => [])
  registerEndpoint(`/api/character_sheets/${sheetId}/proficiency-overrides`, () => [])
  registerEndpoint('/api/backgrounds', () => [])
  const sheet = classSheet(sheetId, className, classId, 5, [], {
    baseAbilityScores: abilityScores({ int: 16, wis: 16 }),
    classes: [{ classId, level: 5, isMain: true, class: { name: className, spellcastingAbility: ability }, subclass: null }],
  })
  const wrapper = await mountSuspended(MagicSection, { props: { characterSheet: sheet }, global: { provide: { spellSlots: slots }, stubs: { UTooltip: { template: '<div><slot /></div>' } } } })
  await flushPromises()
  return wrapper
}

const rowOf = (wrapper: Awaited<ReturnType<typeof mountFor>>, name: string) =>
  wrapper.findAll('span.font-medium').find(s => s.text() === name)!

describe('MagicSection — accordéon de sort', () => {
  it('ouvre le sort sur la ligne : zone, DD, description en paragraphes, sans tiroir', async () => {
    const wrapper = await mountFor(9301, 'Magicien', 1, false)
    expect(wrapper.text()).not.toContain('Sphère de 6 m de rayon')

    await rowOf(wrapper, 'Boule de feu').trigger('click')
    await nextTick()

    expect(wrapper.text()).toContain('Sphère de 6 m de rayon')
    expect(wrapper.text()).toMatch(/DD \d+ · JdS de/)
    expect(wrapper.text()).toContain('Aux niveaux supérieurs')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('un sort d\'attaque annonce son type et le rappel du désavantage à 1,50 m', async () => {
    const wrapper = await mountFor(9302, 'Magicien', 1, false)
    await rowOf(wrapper, 'Rayon de givre').trigger('click')
    await nextTick()
    expect(wrapper.text()).toMatch(/Attaque de sort à distance \(\+\d+\)/)
  })

  it('le magicien lance un sort rituel non préparé en rituel, pas un sort sans l\'étiquette', async () => {
    const wrapper = await mountFor(9303, 'Magicien', 1, false)
    await rowOf(wrapper, 'Détection de la magie').trigger('click')
    await rowOf(wrapper, 'Boule de feu').trigger('click')
    await nextTick()
    expect(wrapper.findAll('button').filter(b => b.text().includes('Lancer en rituel'))).toHaveLength(1)
  })

  it('le clerc ne lance en rituel que le sort qu\'il a préparé', async () => {
    const unprepared = await mountFor(9304, 'Clerc', 2, false, 'wis')
    await rowOf(unprepared, 'Détection de la magie').trigger('click')
    await nextTick()
    expect(unprepared.findAll('button').filter(b => b.text().includes('Lancer en rituel'))).toHaveLength(0)

    const prepared = await mountFor(9305, 'Clerc', 2, true, 'wis')
    await rowOf(prepared, 'Détection de la magie').trigger('click')
    await nextTick()
    expect(prepared.findAll('button').filter(b => b.text().includes('Lancer en rituel'))).toHaveLength(1)
  })
})
