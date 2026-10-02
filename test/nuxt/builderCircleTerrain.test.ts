import { describe, it, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { useCharacterBuilder, type BuilderState } from '../../app/composables/useCharacterBuilder'
import type { Catalog } from '../../shared/rules/resolve'
import { catalogClasses } from '../fixtures/catalogClasses'

// Le terrain du Cercle de la terre est un point de choix de la sous-classe : il apparaît au builder dès que le
// cercle est choisi, au niveau de sous-classe du Druide (2), et pas avant.

const DRUIDE = 4
const EARTH_CIRCLE = 40
const TERRAINS = ['Arctique', 'Forêt', 'Plaine']

registerEndpoint('/api/catalog/classes', () => [{
  id: DRUIDE,
  name: 'Druide',
  subclassLevel: 2,
  subclasses: [{ id: EARTH_CIRCLE, name: 'Cercle de la terre' }, { id: 41, name: 'Cercle de la lune' }],
  proficiencies: catalogClasses().find(c => c.name === 'Druide')!.proficiencies,
}])
registerEndpoint('/api/catalog/progressions', (): Catalog => ({
  progressions: [{
    progressionId: 9,
    ownerClassId: DRUIDE,
    ownerSubclassId: EARTH_CIRCLE,
    ownerLevelRequired: 2,
    kind: 'terrain',
    count: { op: 'fixed', value: 1 },
    optionSource: { type: 'enum', values: TERRAINS },
    replaceable: false,
    options: TERRAINS.map(value => ({ value })),
  }],
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
      Object.assign(builder.state.value, { classId: 'druid', ...partial })
      return () => h('div')
    },
  })
  await mountSuspended(Host)
  return builder
}

describe('Builder — terrain du Cercle de la terre', () => {
  it('Druide 2 du Cercle de la terre : le terrain est demandé, avec ses terrains, et exigé pour l\'étape Classe', async () => {
    const builder = await mountBuilder({ level: 2, subclass: 'Cercle de la terre' })
    await waitFor(() => builder.classChoices.value.length > 0)

    const [choice] = builder.classChoices.value
    expect(choice).toMatchObject({ kind: 'terrain', count: 1, progressionId: 9 })
    expect(choice!.options.map(o => o.value)).toEqual(TERRAINS)

    builder.state.value.choicePicks = {}
    expect(builder.isStepComplete.value('class')).toBe(false)
    builder.state.value.choicePicks = { 9: ['Forêt'] }
    expect(builder.choicePicksPayload.value).toEqual([{ progressionId: 9, value: 'Forêt' }])
  })

  it('un autre cercle, aucun cercle, ou le niveau 1 : pas de terrain', async () => {
    const loaded = await mountBuilder({ level: 2, subclass: 'Cercle de la terre' })
    await waitFor(() => loaded.classChoices.value.length > 0)

    const other = await mountBuilder({ level: 2, subclass: 'Cercle de la lune' })
    const none = await mountBuilder({ level: 2, subclass: null })
    const early = await mountBuilder({ level: 1, subclass: 'Cercle de la terre' })
    await flushPromises()
    expect(other.classChoices.value).toEqual([])
    expect(none.classChoices.value).toEqual([])
    expect(early.classChoices.value).toEqual([])
  })
})
