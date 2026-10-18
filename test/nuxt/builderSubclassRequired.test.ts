import { describe, it, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { useCharacterBuilder, type BuilderState } from '../../app/composables/useCharacterBuilder'
import type { Catalog } from '../../shared/rules/resolve'
import { catalogClasses } from '../fixtures/catalogClasses'

// Quand le niveau du personnage donne déjà accès à la sous-classe, l'étape Classe l'exige, comme le level-up.

const GUERRIER = 5
const CHAMPION = 50

registerEndpoint('/api/catalog/classes', () => [{
  id: GUERRIER,
  name: 'Guerrier',
  subclassLevel: 3,
  subclasses: [{ id: CHAMPION, name: 'Champion' }],
  proficiencies: catalogClasses().find(c => c.name === 'Guerrier')!.proficiencies,
}])
registerEndpoint('/api/catalog/progressions', (): Catalog => ({
  progressions: [{
    progressionId: 7,
    ownerClassId: GUERRIER,
    ownerLevelRequired: 3,
    kind: 'subclass',
    count: { op: 'fixed', value: 1 },
    optionSource: { type: 'subclasses' },
    replaceable: false,
    options: [{ subclassId: CHAMPION }],
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
      Object.assign(builder.state.value, { classId: 'fighter', skills: ['athletics', 'perception'], ...partial })
      return () => h('div')
    },
  })
  await mountSuspended(Host)
  await waitFor(() => builder.subclassOptions.value.length > 0)
  return builder
}

describe('Builder — sous-classe exigée à la création', () => {
  it('Guerrier 3 : l\'étape Classe attend la sous-classe', async () => {
    const builder = await mountBuilder({ level: 3 })
    expect(builder.needsSubclass.value).toBe(true)
    expect(builder.isStepComplete.value('class')).toBe(false)

    builder.state.value.subclass = 'Champion'
    expect(builder.isStepComplete.value('class')).toBe(true)
  })

  it('Guerrier 2 : la sous-classe n\'est pas encore due, l\'étape se complète sans elle', async () => {
    const builder = await mountBuilder({ level: 2 })
    expect(builder.needsSubclass.value).toBe(false)
    expect(builder.isStepComplete.value('class')).toBe(true)
  })
})
