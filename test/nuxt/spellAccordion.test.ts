import { describe, it, expect, afterEach, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import MagicSection from '../../app/components/character_sheet/MagicSection.vue'
import SpellCardBuilder from '../../app/components/character_builder/SpellCardBuilder.vue'
import { spells } from '../../server/db/seeds/data/spells'
import { rollTables } from '../../server/db/seeds/data/rollTables'
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

const CONFUSION_TABLE_ID = 77
const { name, die, entries } = rollTables.find(t => t.key === 'confusion')!
const confusion = { name, die, entries }

const slots = ref({ spellcasting: { 1: { max: 2, current: 2 }, 3: { max: 2, current: 2 } }, pact_magic: {} })

const mountFor = async (sheetId: number, className: string, classId: number, isPrepared: boolean, ability = 'int') => {
  registerEndpoint(`/api/character_sheets/${sheetId}/spells`, () => [
    characterSpell('Boule de feu', 501, true, classId),
    characterSpell('Détection de la magie', 502, isPrepared, classId),
    characterSpell('Rayon de givre', 503, true, classId),
    { ...characterSpell('Confusion', 504, true, classId), spell: { ...seedSpell('Confusion', 504), rollTableId: CONFUSION_TABLE_ID } },
  ])
  registerEndpoint(`/api/catalog/roll-tables/${CONFUSION_TABLE_ID}`, () => confusion)
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
  afterEach(() => vi.restoreAllMocks())

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

  it('le groupe « Dégâts » d\'un sort d\'attaque est un vrai composant, avec la taille de ses boutons', async () => {
    const wrapper = await mountFor(9307, 'Magicien', 1, false)
    expect(wrapper.html().toLowerCase()).not.toContain('<ubuttongroup')
    const damage = wrapper.findAll('button').find(b => b.text().includes('Dégâts'))!
    expect(damage.classes()).toContain('text-xs')
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

  it('un sort à table affiche ses cas en tableau et jette le dé sur la table', async () => {
    const wrapper = await mountFor(9306, 'Magicien', 1, false)
    await rowOf(wrapper, 'Confusion').trigger('click')
    await vi.waitFor(() => expect(wrapper.text()).toContain('La créature ne bouge pas et n\'agit pas.'))

    expect(wrapper.text()).toContain('2-6')
    const highlighted = () => wrapper.findAll('li').filter(li => li.attributes('aria-current') === 'true').map(li => li.text())
    expect(highlighted()).toEqual([])

    vi.spyOn(Math, 'random').mockReturnValue(0.75) // ceil(0.75 × 10) = 8
    await wrapper.findAll('button').find(b => b.text().includes('Lancer le d10'))!.trigger('click')
    expect(highlighted()).toEqual([expect.stringContaining('7-8')])
  })
})

describe('SpellCardBuilder — sort à table', () => {
  it('déplie le sort avec sa table, comme la fiche', async () => {
    registerEndpoint(`/api/catalog/roll-tables/${CONFUSION_TABLE_ID}`, () => confusion)
    const spell = { ...seedSpell('Confusion', 504), rollTableId: CONFUSION_TABLE_ID, school: { name: 'Enchantment' } }
    const wrapper = await mountSuspended(SpellCardBuilder, {
      props: { spell: spell as never, selected: false },
      global: { stubs: { UTooltip: { template: '<div><slot /></div>' } } },
    })
    await wrapper.find('button.cursor-pointer').trigger('click')
    await vi.waitFor(() => expect(wrapper.text()).toContain('La créature agit et se déplace normalement.'))
  })
})
