import { describe, it, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import { getQuery } from 'h3'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { useCharacterBuilder, type BuilderState } from '../../app/composables/useCharacterBuilder'
import type { Catalog } from '../../shared/rules/resolve'
import { PACT_BOON_NAMES } from '../../shared/rules/pactBoon'
import { WARLOCK_PROGRESSION_CONTRACT } from '../fixtures/warlockProgression'
import { catalogClasses } from '../fixtures/catalogClasses'

// Occultiste : le builder demande le pacte (niveau 3) et les manifestations (niveau 2), tous deux des options de feature ;
// le pacte se lit dans le nom de l'option choisie, et une manifestation que le niveau ne propose pas ne part pas.

const WARLOCK = catalogClasses().find(c => c.name === 'Occultiste')!.id
const PACT_PROGRESSION = 20
const INVOCATIONS_PROGRESSION = 21
const PACTS = { chain: 410, blade: 411, tome: 412 }
const INVOCATION = { regard: 401, armure: 402, masques: 403 }
const OPTIONS = [
  ...Object.entries(PACTS).map(([key, id]) => ({ id, name: PACT_BOON_NAMES[key as keyof typeof PACT_BOON_NAMES], description: null })),
  { id: INVOCATION.regard, name: 'Regard de deux esprits', description: null },
  { id: INVOCATION.armure, name: 'Armure des ombres', description: null },
  { id: INVOCATION.masques, name: 'Maître des masques', description: null },
]
const invocationsContract = WARLOCK_PROGRESSION_CONTRACT.find(c => c.kind === 'invocations')!

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
        { featureId: INVOCATION.armure, prerequisites: { requiredPactBoon: 'blade' } },
        { featureId: INVOCATION.masques, levelRequired: 5 },
      ],
    },
  ],
}))
registerEndpoint('/api/catalog/feature-options', (event) => {
  const ids = String(getQuery(event).ids ?? '').split(',').map(Number)
  return OPTIONS.filter(o => ids.includes(o.id))
})

async function waitFor(condition: () => boolean) {
  for (let i = 0; i < 200 && !condition(); i++) {
    await flushPromises()
    await new Promise(r => setTimeout(r, 10))
  }
}

async function mountBuilder(partial: Partial<BuilderState>) {
  let builder!: ReturnType<typeof useCharacterBuilder>
  const Host = defineComponent({
    setup() {
      builder = useCharacterBuilder()
      builder.resetBuilder()
      Object.assign(builder.state.value, { classId: 'warlock', skills: ['arcana', 'deception'], ...partial })
      return () => h('div')
    },
  })
  await mountSuspended(Host)
  await waitFor(() => builder.featurePickChoices.value.length > 0)
  return builder
}

describe('Builder — Occultiste', () => {
  // Le builder partage son état entre les montages : chaque cas se lit avant le suivant.
  it('niveau 3 : le pacte et deux manifestations, exigés pour l\'étape Classe', async () => {
    const builder = await mountBuilder({ level: 3 })

    expect(builder.featurePickChoices.value.map(c => [c.kind, c.count])).toEqual([['pact_boon', 1], ['invocations', 2]])
    expect(builder.isStepComplete.value('class')).toBe(false)

    builder.state.value.featurePicks = { [PACT_PROGRESSION]: [PACTS.tome] }
    await waitFor(() => builder.pactBoon.value === 'tome')
    expect(builder.pactBoon.value).toBe('tome')
    expect(builder.isStepComplete.value('class')).toBe(false)

    builder.state.value.featurePicks = { [PACT_PROGRESSION]: [PACTS.tome], [INVOCATIONS_PROGRESSION]: [INVOCATION.regard, INVOCATION.armure] }
    expect(builder.isStepComplete.value('class')).toBe(true)
    expect(builder.invocationPickIds.value).toEqual([INVOCATION.regard, INVOCATION.armure])
    expect(builder.featurePicksPayload.value).toEqual([
      { progressionId: PACT_PROGRESSION, featureId: PACTS.tome },
      { progressionId: INVOCATIONS_PROGRESSION, featureId: INVOCATION.regard },
      { progressionId: INVOCATIONS_PROGRESSION, featureId: INVOCATION.armure },
    ])
  })

  it('une manifestation d\'un niveau de classe non atteint ne part pas et laisse l\'étape incomplète', async () => {
    const builder = await mountBuilder({ level: 3 })

    builder.state.value.featurePicks = { [PACT_PROGRESSION]: [PACTS.chain], [INVOCATIONS_PROGRESSION]: [INVOCATION.regard, INVOCATION.masques] }
    expect(builder.featurePicksPayload.value.map(p => p.featureId)).toEqual([PACTS.chain, INVOCATION.regard])
    expect(builder.isStepComplete.value('class')).toBe(false)
  })

  it('niveau 2 : pas encore de pacte, donc aucun pacte lu ni envoyé', async () => {
    const builder = await mountBuilder({ level: 2 })

    expect(builder.featurePickChoices.value.map(c => c.kind)).toEqual(['invocations'])
    builder.state.value.featurePicks = { [PACT_PROGRESSION]: [PACTS.blade], [INVOCATIONS_PROGRESSION]: [INVOCATION.regard, INVOCATION.armure] }
    await flushPromises()
    expect(builder.pactBoon.value).toBeNull()
    expect(builder.featurePicksPayload.value.map(p => p.featureId)).toEqual([INVOCATION.regard, INVOCATION.armure])
    expect(builder.isStepComplete.value('class')).toBe(true)
  })

  it('changer de pacte change le pacte lu, et un pacte retiré n\'en laisse aucun', async () => {
    const builder = await mountBuilder({ level: 3 })
    builder.state.value.featurePicks = { [PACT_PROGRESSION]: [PACTS.tome] }
    await waitFor(() => builder.pactBoon.value === 'tome')

    builder.state.value.featurePicks = { [PACT_PROGRESSION]: [PACTS.blade] }
    await waitFor(() => builder.pactBoon.value === 'blade')
    expect(builder.pactBoon.value).toBe('blade')

    builder.state.value.featurePicks = {}
    expect(builder.pactBoon.value).toBeNull()
  })
})

describe('Étape Classe — Occultiste', () => {
  it('propose le pacte et les manifestations par le même sélecteur, verrouille ce que le pacte n\'ouvre pas', async () => {
    registerEndpoint('/api/spells', () => [])
    const { default: StepClass } = await import('../../app/components/character_builder/StepClass.vue')
    let builder!: ReturnType<typeof useCharacterBuilder>
    const Host = defineComponent({
      setup() {
        builder = useCharacterBuilder()
        builder.resetBuilder()
        Object.assign(builder.state.value, { classId: 'warlock', skills: ['arcana', 'deception'], level: 5 })
        return () => h(StepClass)
      },
    })
    const wrapper = await mountSuspended(Host)
    const text = () => wrapper.text().replace(/\s+/g, ' ')
    const click = async (label: string) => {
      await wrapper.findAll('button').find(b => b.text().startsWith(label))!.trigger('click')
      await flushPromises()
    }
    await waitFor(() => text().includes('Maître des masques'))

    expect(text()).toContain('Don du Pacte')
    expect(text()).toContain('Manifestations occultes')
    expect(text()).toContain('Pacte de la Lame requis')

    await click('Pacte de la Lame')
    await waitFor(() => builder.pactBoon.value === 'blade')
    expect(text()).toContain('Vous choisirez votre arme de pacte')
    expect(text()).not.toContain('Pacte de la Lame requis')

    await click('Armure des ombres')
    await click('Maître des masques')
    await click('Regard de deux esprits')
    expect(builder.invocationPickIds.value).toEqual([INVOCATION.armure, INVOCATION.masques, INVOCATION.regard])
    expect(builder.isStepComplete.value('class')).toBe(true)
  })
})
