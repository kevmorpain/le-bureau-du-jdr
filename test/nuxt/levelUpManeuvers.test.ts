import { describe, it, expect, beforeAll } from 'vitest'
import { defineComponent, h, provide, ref, type Ref } from 'vue'
import { getQuery } from 'h3'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import LevelUpStepFeatures from '../../app/components/level_up/LevelUpStepFeatures.vue'
import { useLevelUp, type CharacterSheetWithASI } from '../../app/composables/useLevelUp'
import type { Catalog } from '../../shared/rules/resolve'
import { guerrierSubclasses } from '../../server/db/seeds/data/guerrier'
import { maneuverFeatures } from '../../server/db/seeds/data/maneuvers'
import { catalogClasses } from '../fixtures/catalogClasses'

// Montée du Maître de guerre au niveau 7 : l'étape Aptitudes propose deux manœuvres, et en échange d'une connue en ajoute une.

const GUERRIER = 5
const MASTER = 50
const PROGRESSION = 8
const OPTIONS = maneuverFeatures.map((f, i) => ({ id: 100 + i, name: f.name, description: f.description }))
const KNOWN = OPTIONS.slice(0, 3)
const idOf = (name: string) => OPTIONS.find(o => o.name === name)!.id

beforeAll(() => {
  registerEndpoint('/api/catalog/classes', () => [{
    id: GUERRIER,
    name: 'Guerrier',
    subclassLevel: 3,
    subclasses: [{ id: MASTER, name: 'Maître de guerre' }],
    proficiencies: catalogClasses().find(c => c.name === 'Guerrier')!.proficiencies,
  }])
  registerEndpoint('/api/catalog/progressions', (): Catalog => ({
    progressions: [{
      progressionId: PROGRESSION,
      ownerClassId: GUERRIER,
      ownerSubclassId: MASTER,
      ownerLevelRequired: 3,
      ...guerrierSubclasses.find(s => s.name === 'Maître de guerre')!.features.find(f => f.name === 'Supériorité martiale')!.progression!,
      replaceable: true,
      options: OPTIONS.map(o => ({ featureId: o.id })),
    }],
  }))
  registerEndpoint('/api/catalog/feature-options', (event) => {
    const ids = String(getQuery(event).ids ?? '').split(',').map(Number)
    return OPTIONS.filter(o => ids.includes(o.id))
  })
  registerEndpoint('/api/catalog/classes/Guerrier/subclasses', () => [])
  registerEndpoint('/api/catalog/classes/Guerrier/fighting-styles', () => [])
  registerEndpoint('/api/invocations', () => [])
})

const sheet = (level: number) => ({
  id: 1,
  classes: [{ classId: GUERRIER, level, isMain: true, subclassId: MASTER, class: { name: 'Guerrier' }, subclass: { name: 'Maître de guerre' } }],
  baseAbilityScores: [{ abilityId: 'str', value: 16 }],
  skills: [],
  spells: [],
  features: KNOWN.map(o => ({ featureId: o.id })),
})

async function waitFor(condition: () => boolean) {
  for (let i = 0; i < 100 && !condition(); i++) {
    await flushPromises()
    await new Promise(r => setTimeout(r, 10))
  }
  expect(condition()).toBe(true)
}

async function mountFeaturesStep(fromLevel: number) {
  const charSheet = ref(sheet(fromLevel))
  let levelUp!: ReturnType<typeof useLevelUp>
  const Host = defineComponent({
    setup() {
      provide('charSheet', charSheet)
      levelUp = useLevelUp(charSheet as unknown as Ref<CharacterSheetWithASI | null>)
      levelUp.resetWizard()
      Object.assign(levelUp.state.value, { pickedClassId: 'fighter', isMulticlass: false, fromLevel, toLevel: fromLevel + 1 })
      return () => h(LevelUpStepFeatures)
    },
  })
  const wrapper = await mountSuspended(Host)
  const text = () => wrapper.text().replace(/\s+/g, ' ')
  const click = async (label: string) => {
    await wrapper.findAll('button').find(b => b.text().startsWith(label))!.trigger('click')
    await flushPromises()
  }
  // Les cartes d'option se reconnaissent à leur description sous le nom ; les puces de remplacement n'en ont pas.
  const cards = () => wrapper.findAll('button').map(b => b.text()).filter(t => t.length > 60)
  return { levelUp, text, click, cards }
}

describe('Étape Aptitudes du level-up — manœuvres du Maître de guerre', () => {
  it('niveau 6 → 7 : deux manœuvres à apprendre, parmi celles qu\'on ne connaît pas', async () => {
    const { levelUp, text, click, cards } = await mountFeaturesStep(6)
    await waitFor(() => levelUp.newFeaturePickChoices.value.length > 0)
    await waitFor(() => text().includes('Fente'))

    expect(levelUp.newFeaturePickChoices.value[0]).toMatchObject({ kind: 'maneuvers', count: 2 })
    expect(text()).toContain('0/2')
    expect(levelUp.isStepComplete.value('features')).toBe(false)
    // Les manœuvres connues ne sont plus proposées : seul le choix de remplacement les porte.
    expect(cards().map(c => c.slice(0, 12))).not.toContain('Attaque mena')
    expect(cards()).toHaveLength(OPTIONS.length - KNOWN.length)

    await click('Fente')
    await click('Regain')
    expect(levelUp.isStepComplete.value('features')).toBe(true)
    expect(levelUp.featurePicksPayload.value.map(p => p.featureId)).toEqual([idOf('Fente'), idOf('Regain')])
    expect(levelUp.featureReplacementsPayload.value).toEqual([])
  })

  it('remplacer une manœuvre connue en ajoute une à choisir, et la retire des choix', async () => {
    const { levelUp, text, click } = await mountFeaturesStep(6)
    await waitFor(() => text().includes('Remplacer une option déjà prise'))

    await click('Fente')
    await click('Regain')
    await click(KNOWN[0]!.name)
    expect(levelUp.state.value.featureReplacements[PROGRESSION]).toBe(KNOWN[0]!.id)
    expect(text()).toContain('2/3')
    expect(levelUp.isStepComplete.value('features')).toBe(false)

    await click('Repousser')
    expect(levelUp.isStepComplete.value('features')).toBe(true)
    expect(levelUp.featureReplacementsPayload.value).toEqual([{ progressionId: PROGRESSION, featureId: KNOWN[0]!.id }])
    expect(levelUp.featurePicksPayload.value).toHaveLength(3)

    await click(KNOWN[0]!.name)
    expect(levelUp.state.value.featureReplacements[PROGRESSION]).toBeNull()
    expect(levelUp.featurePicksPayload.value).toHaveLength(2)
  })

  it('niveau 7 → 8 : rien à apprendre', async () => {
    const { levelUp } = await mountFeaturesStep(7)
    await flushPromises()

    expect(levelUp.newFeaturePickChoices.value).toEqual([])
    expect(levelUp.isStepComplete.value('features')).toBe(true)
  })
})
