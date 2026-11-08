import { describe, it, expect } from 'vitest'
import { computed, defineComponent, h, nextTick, ref, toRef } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import CombatModeSection from '../../app/components/character_sheet/CombatModeSection.vue'
import MagicSection from '../../app/components/character_sheet/MagicSection.vue'
import { useUnconsciousEndings } from '../../app/composables/character/useUnconsciousEndings'
import { useCharacterSheet } from '../../app/composables/useCharacterSheet'
import { barbareFeatures } from '../../server/db/seeds/data/barbare'
import { classSheet, featureRow, named } from '../fixtures/classSheet'

// Rage : fin à l'inconscience, question au « Nouveau tour », sorts interdits.

const BARBARIAN = 1
const WIZARD = 2

// `useFetch` met l'inventaire en cache par URL : une fiche (donc des endpoints) par montage.
let sheetSeq = 9400
const nextSheetId = () => {
  const id = ++sheetSeq
  registerEndpoint(`/api/character_sheets/${id}/inventory`, () => [])
  registerEndpoint(`/api/character_sheets/${id}/backgrounds`, () => [])
  registerEndpoint(`/api/character_sheets/${id}/spells`, () => [])
  registerEndpoint(`/api/character_sheets/${id}/features`, { method: 'PUT', handler: () => ({ success: true }) })
  return id
}

const barbarian = (level: number, active: boolean, extra: Record<string, unknown> = {}) =>
  classSheet(nextSheetId(), 'Barbare', BARBARIAN, level, [featureRow(named(barbareFeatures, 'Rage'), BARBARIAN, { active })], {
    currentHp: 30, temporaryHp: 0, deathSaveSuccesses: 0, deathSaveFailures: 0, ...extra,
  })

const spellSlots = () => ref({ spellcasting: {}, pact_magic: {} })
const tick = () => new Promise(r => setTimeout(r, 30))
const buttonWith = (wrapper: { findAll: (s: string) => { text: () => string }[] }, text: string) =>
  wrapper.findAll('button').find(b => b.text().includes(text)) as { trigger: (e: string) => Promise<void> } | undefined

const mountCombat = async (characterSheet: ReturnType<typeof barbarian>) => {
  const wrapper = await mountSuspended(CombatModeSection, {
    props: { characterSheet },
    global: { provide: { spellSlots: spellSlots() }, stubs: { UTooltip: { template: '<div><slot /></div>' } } },
  })
  await tick()
  return wrapper
}

describe('Mode combat — la rage est-elle entretenue ?', () => {
  it('au « Nouveau tour », la rage demande si elle a été entretenue ; « Non » y met fin', async () => {
    const cs = barbarian(5, true)
    const wrapper = await mountCombat(cs)
    expect(wrapper.text()).not.toContain('toujours en cours')

    await buttonWith(wrapper, 'Nouveau tour')!.trigger('click')
    await nextTick()
    expect(wrapper.text()).toContain('Rage : toujours en cours')
    expect(wrapper.text()).toContain('avez-vous attaqué une créature hostile ou subi des dégâts')

    await buttonWith(wrapper, 'Non, elle prend fin')!.trigger('click')
    await tick()
    expect(cs.features[0].active).toBe(false)
    expect(wrapper.text()).not.toContain('toujours en cours')
  })

  it('« Oui » garde la rage et ferme la question', async () => {
    const cs = barbarian(5, true)
    const wrapper = await mountCombat(cs)

    await buttonWith(wrapper, 'Nouveau tour')!.trigger('click')
    await nextTick()
    await buttonWith(wrapper, 'Oui, elle continue')!.trigger('click')
    await tick()

    expect(cs.features[0].active).toBe(true)
    expect(wrapper.text()).not.toContain('toujours en cours')
  })

  it('Rage persistante (niveau 15) ou rage inactive : aucune question', async () => {
    for (const cs of [barbarian(15, true), barbarian(5, false)]) {
      const wrapper = await mountCombat(cs)
      await buttonWith(wrapper, 'Nouveau tour')!.trigger('click')
      await nextTick()
      expect(wrapper.text()).not.toContain('toujours en cours')
    }
  })
})

describe('Fiche — la rage prend fin à l\'inconscience', () => {
  let toggleCondition: (condition: 'unconscious') => void
  const Harness = defineComponent({
    props: { characterSheet: { type: Object, required: true } },
    setup(props) {
      const sheet = toRef(props, 'characterSheet') as never
      const layers = useCharacterSheet(sheet)
      toggleCondition = layers.toggleCondition
      useUnconsciousEndings(sheet, {
        unconscious: computed(() => layers.isDying.value || layers.activeConditions.value.includes('unconscious')),
        ending: layers.featuresEndingWhenUnconscious,
      })
      return () => h('div')
    },
  })

  it('tomber à 0 PV met fin à la rage', async () => {
    const cs = barbarian(5, true)
    await mountSuspended(Harness, { props: { characterSheet: cs } })
    await tick()
    expect(cs.features[0].active).toBe(true)

    cs.currentHp = 0
    await flushPromises()
    await tick()

    expect(cs.features[0].active).toBe(false)
  })

  it('l\'état Inconscient aussi, sans toucher aux PV', async () => {
    const cs = barbarian(5, true)
    await mountSuspended(Harness, { props: { characterSheet: cs } })
    await tick()

    toggleCondition('unconscious')
    await flushPromises()
    await tick()

    expect(cs.features[0].active).toBe(false)
    toggleCondition('unconscious')
  })

  it('une fiche déjà à 0 PV au chargement n\'est pas touchée : seule la chute y met fin', async () => {
    const cs = barbarian(5, true, { currentHp: 0 })
    await mountSuspended(Harness, { props: { characterSheet: cs } })
    await tick()

    expect(cs.features[0].active).toBe(true)
  })
})

describe('Magie — sorts interdits en rage', () => {
  const caster = (active: boolean) => {
    const id = nextSheetId()
    return classSheet(id, 'Barbare', BARBARIAN, 5, [featureRow(named(barbareFeatures, 'Rage'), BARBARIAN, { active })], {
      classes: [
        { classId: BARBARIAN, level: 5, isMain: true, class: { name: 'Barbare' }, subclass: null },
        { classId: WIZARD, level: 5, isMain: false, class: { name: 'Magicien', spellcastingAbility: 'int' }, subclass: null },
      ],
    })
  }
  const mountMagic = async (characterSheet: ReturnType<typeof caster>) => {
    const wrapper = await mountSuspended(MagicSection, {
      props: { characterSheet },
      global: { provide: { spellSlots: spellSlots() }, stubs: { UTooltip: { template: '<div><slot /></div>' } } },
    })
    await flushPromises()
    return wrapper
  }

  it('un lanceur de sorts en rage voit l\'avertissement', async () => {
    const wrapper = await mountMagic(caster(true))
    expect(wrapper.text()).toContain('Rage : vous ne pouvez ni lancer de sorts ni vous concentrer sur eux.')
  })

  it('hors rage, ou sans lanceur de sorts, rien', async () => {
    expect((await mountMagic(caster(false))).text()).not.toContain('vous ne pouvez ni lancer de sorts')

    const plain = barbarian(5, true)
    const wrapper = await mountMagic(plain as never)
    expect(wrapper.text()).not.toContain('vous ne pouvez ni lancer de sorts')
  })
})
