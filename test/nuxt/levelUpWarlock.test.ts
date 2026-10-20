import { describe, it, expect, beforeAll } from 'vitest'
import { defineComponent, h, provide, ref, type Ref } from 'vue'
import { getQuery } from 'h3'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import LevelUpStepFeatures from '../../app/components/level_up/LevelUpStepFeatures.vue'
import { useLevelUp, type CharacterSheetWithASI } from '../../app/composables/useLevelUp'
import type { Catalog } from '../../shared/rules/resolve'
import { PACT_BOON_NAMES } from '../../shared/rules/pactBoon'
import { WARLOCK_PROGRESSION_CONTRACT } from '../fixtures/warlockProgression'
import { catalogClasses } from '../fixtures/catalogClasses'

// Montée de l'Occultiste : le pacte au niveau 3, les manifestations (nouvelles, ou en remplacement d'une connue à n'importe
// quel niveau), avec les prérequis qui verrouillent une carte sans la masquer.

const WARLOCK = catalogClasses().find(c => c.name === 'Occultiste')!.id
const PACT_PROGRESSION = 20
const INVOCATIONS_PROGRESSION = 21
const PACTS = { chain: 410, blade: 411, tome: 412 }
const INVOCATION = { regard: 401, armure: 402, lance: 403, masques: 404, sombre: 405 }
const OPTIONS = [
  ...Object.entries(PACTS).map(([key, id]) => ({ id, name: PACT_BOON_NAMES[key as keyof typeof PACT_BOON_NAMES], description: `Description ${key}` })),
  { id: INVOCATION.regard, name: 'Regard de deux esprits', description: 'Voir par les yeux d\'un autre' },
  { id: INVOCATION.armure, name: 'Armure des ombres', description: 'Armure de mage à volonté' },
  { id: INVOCATION.lance, name: 'Lance occulte', description: 'Maniement de la Lame' },
  { id: INVOCATION.masques, name: 'Maître des masques', description: 'Changer de visage' },
  { id: INVOCATION.sombre, name: 'Vision du diable', description: 'Voir dans les ténèbres magiques' },
]

const invocationsContract = WARLOCK_PROGRESSION_CONTRACT.find(c => c.kind === 'invocations')!

beforeAll(() => {
  registerEndpoint('/api/catalog/classes', catalogClasses)
  registerEndpoint('/api/catalog/progressions', (): Catalog => ({
    progressions: [
      {
        progressionId: PACT_PROGRESSION,
        ownerClassId: WARLOCK,
        ownerLevelRequired: 3,
        kind: 'pact_boon',
        count: { op: 'fixed', value: 1 },
        optionSource: { type: 'feature_group', group: 'pact_boon' },
        replaceable: false,
        options: Object.values(PACTS).map(featureId => ({ featureId })),
      },
      {
        progressionId: INVOCATIONS_PROGRESSION,
        ownerClassId: WARLOCK,
        ownerLevelRequired: invocationsContract.ownerLevelRequired,
        kind: 'invocations',
        count: invocationsContract.count,
        optionSource: invocationsContract.optionSource,
        replaceable: true,
        options: [
          { featureId: INVOCATION.regard },
          { featureId: INVOCATION.armure },
          { featureId: INVOCATION.lance, prerequisites: { requiredPactBoon: 'blade' } },
          { featureId: INVOCATION.masques, levelRequired: 5 },
          { featureId: INVOCATION.sombre, levelRequired: 9 },
        ],
      },
    ],
  }))
  registerEndpoint('/api/catalog/feature-options', (event) => {
    const ids = String(getQuery(event).ids ?? '').split(',').map(Number)
    return OPTIONS.filter(o => ids.includes(o.id))
  })
  registerEndpoint('/api/catalog/classes/Occultiste/subclasses', () => [])
  registerEndpoint('/api/invocations', () => [])
})

const held = [INVOCATION.regard, INVOCATION.armure]
const sheet = (level: number, pactBoon: string | null, owned: number[] = held) => ({
  id: 1,
  classes: [{ classId: WARLOCK, level, isMain: true, pactBoon, class: { name: 'Occultiste' } }],
  baseAbilityScores: [{ abilityId: 'cha', value: 16 }],
  skills: [],
  spells: [],
  features: owned.map(featureId => ({
    featureId,
    feature: { id: featureId, name: OPTIONS.find(o => o.id === featureId)!.name, featureType: 'eldritch_invocation' },
  })),
})

async function waitFor(condition: () => boolean) {
  for (let i = 0; i < 100 && !condition(); i++) {
    await flushPromises()
    await new Promise(r => setTimeout(r, 10))
  }
  expect(condition()).toBe(true)
}

async function mountFeaturesStep(fromLevel: number, pactBoon: string | null, owned?: number[]) {
  const charSheet = ref(sheet(fromLevel, pactBoon, owned))
  let levelUp!: ReturnType<typeof useLevelUp>
  const Host = defineComponent({
    setup() {
      provide('charSheet', charSheet)
      levelUp = useLevelUp(charSheet as unknown as Ref<CharacterSheetWithASI | null>)
      levelUp.resetWizard()
      Object.assign(levelUp.state.value, { pickedClassId: 'warlock', isMulticlass: false, fromLevel, toLevel: fromLevel + 1 })
      return () => h(LevelUpStepFeatures)
    },
  })
  const wrapper = await mountSuspended(Host)
  const text = () => wrapper.text().replace(/\s+/g, ' ')
  const click = async (label: string) => {
    await wrapper.findAll('button').find(b => b.text().startsWith(label))!.trigger('click')
    await flushPromises()
  }
  const button = (label: string) => wrapper.findAll('button').find(b => b.text().startsWith(label))
  return { levelUp, text, click, button }
}

describe('Étape Aptitudes du level-up — manifestations de l\'Occultiste', () => {
  it('niveau 5 → 6 : aucune manifestation de plus, mais l\'une des connues se remplace', async () => {
    const { levelUp, text, click } = await mountFeaturesStep(5, 'blade')
    await waitFor(() => text().includes('Remplacer une option déjà prise'))

    expect(levelUp.newFeaturePickChoices.value.map(c => [c.kind, c.count])).toEqual([['invocations', 0]])
    expect(text()).toContain('Rien de nouveau à ce niveau')
    expect(levelUp.isStepComplete.value('features')).toBe(true)

    await click('Regard de deux esprits')
    expect(levelUp.state.value.featureReplacements[INVOCATIONS_PROGRESSION]).toBe(INVOCATION.regard)
    expect(levelUp.isStepComplete.value('features')).toBe(false)
    await waitFor(() => text().includes('Lance occulte'))

    await click('Lance occulte')
    expect(levelUp.isStepComplete.value('features')).toBe(true)
    expect(levelUp.featurePicksPayload.value).toEqual([{ progressionId: INVOCATIONS_PROGRESSION, featureId: INVOCATION.lance }])
    expect(levelUp.featureReplacementsPayload.value).toEqual([{ progressionId: INVOCATIONS_PROGRESSION, featureId: INVOCATION.regard }])
  })

  it('les manifestations déjà prises ne se reprennent pas, ni celles d\'un niveau de classe que l\'on n\'a pas atteint', async () => {
    const { text, click } = await mountFeaturesStep(5, 'blade')
    await waitFor(() => text().includes('Remplacer une option déjà prise'))
    await click('Armure des ombres')
    await waitFor(() => text().includes('Maître des masques'))

    const cards = text()
    expect(cards).toContain('Lance occulte')
    expect(cards).not.toContain('Vision du diable')
    expect(cards.match(/Armure des ombres/g)).toHaveLength(1)
  })

  it('un prérequis non rempli verrouille la carte, avec sa raison, sans la masquer', async () => {
    const { levelUp, text, click, button } = await mountFeaturesStep(5, 'tome')
    await waitFor(() => text().includes('Remplacer une option déjà prise'))
    await click('Regard de deux esprits')
    await waitFor(() => text().includes('Lance occulte'))

    expect(text()).toContain('Pacte de la Lame requis')
    expect(button('Lance occulte')!.attributes('disabled')).toBeDefined()
    await click('Lance occulte')
    expect(levelUp.featurePicksPayload.value).toEqual([])
  })

  it('niveau 4 → 5 : une manifestation de plus, sans remplacement obligatoire', async () => {
    const { levelUp, text, click } = await mountFeaturesStep(4, 'chain')
    await waitFor(() => text().includes('Maître des masques'))

    expect(levelUp.newFeaturePickChoices.value.map(c => [c.kind, c.count])).toEqual([['invocations', 1]])
    expect(levelUp.isStepComplete.value('features')).toBe(false)
    await click('Maître des masques')
    expect(levelUp.isStepComplete.value('features')).toBe(true)
    expect(levelUp.featureReplacementsPayload.value).toEqual([])
  })
})

describe('Étape Aptitudes du level-up — faveur de pacte de l\'Occultiste', () => {
  it('niveau 2 → 3 : le pacte choisi se lit dans son nom, et ouvre la suite qui lui revient', async () => {
    const { levelUp, text, click } = await mountFeaturesStep(2, null)
    await waitFor(() => text().includes('Pacte de la Lame'))

    expect(levelUp.pickedPactBoon.value).toBeNull()
    expect(levelUp.isStepComplete.value('features')).toBe(false)

    await click('Pacte de la Lame')
    expect(levelUp.state.value.featurePicks[PACT_PROGRESSION]).toEqual([PACTS.blade])
    expect(levelUp.pickedPactBoon.value).toBe('blade')
    expect(levelUp.isStepComplete.value('features')).toBe(true)
    expect(text()).toContain('Arme de pacte')

    // Un seul pacte : une autre carte ne s'ajoute pas, la même se décoche.
    await click('Pacte du Tome')
    expect(levelUp.pickedPactBoon.value).toBe('blade')
    await click('Pacte de la Lame')
    expect(levelUp.pickedPactBoon.value).toBeNull()
    expect(levelUp.isStepComplete.value('features')).toBe(false)
  })

  it('un pacte déjà pris est celui que la classe porte, et n\'est plus proposé', async () => {
    const { levelUp } = await mountFeaturesStep(3, 'chain')
    await flushPromises()

    expect(levelUp.newFeaturePickChoices.value.map(c => c.kind)).not.toContain('pact_boon')
    expect(levelUp.effectivePactBoon.value).toBe('chain')
  })
})
