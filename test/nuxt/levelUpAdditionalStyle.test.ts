import { describe, it, expect, beforeAll } from 'vitest'
import { defineComponent, h, provide, ref, type Ref } from 'vue'
import { getQuery } from 'h3'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import LevelUpStepFeatures from '../../app/components/level_up/LevelUpStepFeatures.vue'
import { useLevelUp, type CharacterSheetWithASI } from '../../app/composables/useLevelUp'
import type { Catalog } from '../../shared/rules/resolve'
import { fightingStyleProgression } from '../../server/db/seeds/data/fightingStyles'
import { catalogClasses } from '../fixtures/catalogClasses'

// Montée du Champion au niveau 10 : l'étape Aptitudes propose le deuxième style de combat, sans celui qu'il a déjà.

const GUERRIER = 5
const CHAMPION = 50
const ARCHERY = 31
const DEFENSE = 32
const DUELING = 33
const STYLES = [{ id: ARCHERY, name: 'Archerie' }, { id: DEFENSE, name: 'Défense' }, { id: DUELING, name: 'Duel' }]

beforeAll(() => {
  registerEndpoint('/api/catalog/classes', () => [{
    id: GUERRIER,
    name: 'Guerrier',
    subclassLevel: 3,
    subclasses: [{ id: CHAMPION, name: 'Champion' }],
    proficiencies: catalogClasses().find(c => c.name === 'Guerrier')!.proficiencies,
  }])
  registerEndpoint('/api/catalog/progressions', (): Catalog => ({
    progressions: [
      {
        progressionId: 4,
        ownerClassId: GUERRIER,
        ownerLevelRequired: 1,
        ...fightingStyleProgression,
        replaceable: false,
        options: STYLES.map(s => ({ featureId: s.id })),
      },
      {
        progressionId: 7,
        ownerClassId: GUERRIER,
        ownerSubclassId: CHAMPION,
        ownerLevelRequired: 10,
        kind: 'additional_fighting_style',
        count: { op: 'fixed', value: 1 },
        optionSource: { type: 'feature_group', group: 'fighting_style' },
        replaceable: false,
        options: STYLES.map(s => ({ featureId: s.id })),
      },
    ],
  }))
  registerEndpoint('/api/catalog/feature-options', (event) => {
    const ids = String(getQuery(event).ids ?? '').split(',').map(Number)
    return STYLES.filter(s => ids.includes(s.id)).map(s => ({ ...s, description: `Description de ${s.name}` }))
  })
  registerEndpoint('/api/catalog/classes/Guerrier/subclasses', () => [])
  registerEndpoint('/api/invocations', () => [])
})

const sheet = (level: number) => ({
  id: 1,
  classes: [{ classId: GUERRIER, level, isMain: true, subclassId: CHAMPION, class: { name: 'Guerrier' }, subclass: { name: 'Champion' } }],
  baseAbilityScores: [{ abilityId: 'str', value: 16 }],
  skills: [],
  spells: [],
  features: [{ featureId: DUELING }],
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
  return { levelUp, wrapper, text: () => wrapper.text().replace(/\s+/g, ' ') }
}

describe('Étape Aptitudes du level-up — deuxième style du Champion', () => {
  it('niveau 9 → 10 : le choix est proposé sans le style déjà pris, et exigé', async () => {
    const { levelUp, wrapper, text } = await mountFeaturesStep(9)
    await waitFor(() => levelUp.newFeaturePickChoices.value.length > 0)
    await waitFor(() => text().includes('Archerie'))

    expect(text()).toContain('Style de combat supplémentaire')
    expect(text()).toContain('Défense')
    expect(text()).not.toContain('Duel')
    expect(levelUp.isStepComplete.value('features')).toBe(false)

    const defense = wrapper.findAll('button').find(b => b.text().includes('Défense'))!
    await defense.trigger('click')
    expect(levelUp.state.value.featurePicks[7]).toEqual([DEFENSE])
    expect(levelUp.isStepComplete.value('features')).toBe(true)
  })

  it('niveau 10 → 11 : plus rien à choisir', async () => {
    const { levelUp } = await mountFeaturesStep(10)
    await flushPromises()

    expect(levelUp.newFeaturePickChoices.value).toEqual([])
    expect(levelUp.isStepComplete.value('features')).toBe(true)
  })
})
