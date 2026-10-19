import { describe, it, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { useCharacterBuilder, type BuilderState } from '../../app/composables/useCharacterBuilder'
import type { Catalog } from '../../shared/rules/resolve'
import { fightingStyleProgression } from '../../server/db/seeds/data/fightingStyles'
import { catalogClasses } from '../fixtures/catalogClasses'

// Champion niveau 10 : le builder demande le deuxième style de combat en plus du premier.

const GUERRIER = 5
const CHAMPION = 50
const ARCHERY = 31
const DEFENSE = 32
const DUELING = 33

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
      progressionId: 3,
      ownerClassId: GUERRIER,
      ownerLevelRequired: 3,
      kind: 'subclass',
      count: { op: 'fixed', value: 1 },
      optionSource: { type: 'subclasses' },
      replaceable: false,
      options: [{ subclassId: CHAMPION }],
    },
    {
      progressionId: 4,
      ownerClassId: GUERRIER,
      ownerLevelRequired: 1,
      ...fightingStyleProgression,
      replaceable: false,
      options: [ARCHERY, DEFENSE, DUELING].map(featureId => ({ featureId })),
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
      options: [ARCHERY, DEFENSE, DUELING].map(featureId => ({ featureId })),
    },
  ],
}))

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
      Object.assign(builder.state.value, { classId: 'fighter', skills: ['athletics', 'perception'], ...partial })
      return () => h('div')
    },
  })
  await mountSuspended(Host)
  await waitFor(() => builder.subclassOptions.value.length > 0)
  return builder
}

describe('Builder — styles de combat', () => {
  it('niveau 10 du Champion : un 2ᵉ style en plus du premier, tous deux exigés pour l\'étape Classe', async () => {
    const builder = await mountBuilder({ level: 10, subclass: 'Champion' })
    await waitFor(() => builder.featurePickChoices.value.length > 1)

    expect(builder.featurePickChoices.value.map(c => [c.kind, c.count])).toEqual([['fighting_style', 1], ['additional_fighting_style', 1]])
    expect(builder.isStepComplete.value('class')).toBe(false)

    builder.state.value.featurePicks = { 4: [DUELING] }
    expect(builder.isStepComplete.value('class')).toBe(false)

    builder.state.value.featurePicks = { 4: [DUELING], 7: [DEFENSE] }
    expect(builder.isStepComplete.value('class')).toBe(true)
    expect(builder.featurePicksPayload.value).toEqual([{ progressionId: 4, featureId: DUELING }, { progressionId: 7, featureId: DEFENSE }])
  })

  it('chaque style exclut celui que l\'autre point de choix a pris', async () => {
    const builder = await mountBuilder({ level: 10, subclass: 'Champion' })
    await waitFor(() => builder.featurePickChoices.value.length > 1)

    builder.state.value.featurePicks = { 4: [DUELING], 7: [DEFENSE] }
    expect(builder.featurePicksElsewhere(7)).toEqual([DUELING])
    expect(builder.featurePicksElsewhere(4)).toEqual([DEFENSE])
  })

  // Le builder partage son état entre les montages : chaque cas se lit avant le suivant.
  it('niveau 9 : pas de deuxième style', async () => {
    const builder = await mountBuilder({ level: 9, subclass: 'Champion' })
    await waitFor(() => builder.featurePickChoices.value.length > 0)

    expect(builder.featurePickChoices.value.map(c => c.kind)).toEqual(['fighting_style'])
    expect(builder.isStepComplete.value('class')).toBe(false)
    builder.state.value.featurePicks = { 4: [ARCHERY] }
    expect(builder.isStepComplete.value('class')).toBe(true)
  })

  it('niveau 10 sans sous-classe : pas de deuxième style', async () => {
    const builder = await mountBuilder({ level: 10, subclass: null })
    await waitFor(() => builder.featurePickChoices.value.length > 0)

    expect(builder.featurePickChoices.value.map(c => c.kind)).toEqual(['fighting_style'])
  })

  it('un style que le niveau ou la classe ne propose plus n\'est pas envoyé', async () => {
    const builder = await mountBuilder({ level: 9, subclass: 'Champion' })
    await waitFor(() => builder.featurePickChoices.value.length > 0)

    builder.state.value.featurePicks = { 4: [999] }
    expect(builder.featurePicksPayload.value).toEqual([])
    expect(builder.isStepComplete.value('class')).toBe(false)
  })
})
