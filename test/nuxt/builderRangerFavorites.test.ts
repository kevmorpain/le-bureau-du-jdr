import { describe, it, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { useCharacterBuilder, type BuilderState } from '../../app/composables/useCharacterBuilder'
import type { Catalog } from '../../shared/rules/resolve'
import { FAVORED_ENEMIES, FAVORED_TERRAINS } from '../../shared/rules/rangerFavorites'
import { FAVORED_ENEMY_COUNT, FAVORED_TERRAIN_COUNT } from '../../server/db/seeds/data/rodeur'
import { catalogClasses } from '../fixtures/catalogClasses'

// Le Rôdeur choisit ses ennemis jurés et ses terrains favoris à la création, en nombre selon son niveau.

const RODEUR = 10
const ENEMY = 21
const TERRAIN = 22

registerEndpoint('/api/catalog/classes', () => [{
  id: RODEUR,
  name: 'Rôdeur',
  subclassLevel: 3,
  subclasses: [],
  proficiencies: catalogClasses().find(c => c.name === 'Rôdeur')!.proficiencies,
}])
registerEndpoint('/api/catalog/progressions', (): Catalog => ({
  progressions: [
    {
      progressionId: ENEMY,
      ownerClassId: RODEUR,
      ownerLevelRequired: 1,
      kind: 'favored_enemy',
      count: FAVORED_ENEMY_COUNT,
      optionSource: { type: 'enum', values: [...FAVORED_ENEMIES] },
      replaceable: false,
      options: FAVORED_ENEMIES.map(value => ({ value })),
    },
    {
      progressionId: TERRAIN,
      ownerClassId: RODEUR,
      ownerLevelRequired: 1,
      kind: 'terrain',
      count: FAVORED_TERRAIN_COUNT,
      optionSource: { type: 'enum', values: [...FAVORED_TERRAINS] },
      replaceable: false,
      options: FAVORED_TERRAINS.map(value => ({ value })),
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
      Object.assign(builder.state.value, { classId: 'ranger', skills: ['athletics', 'nature', 'survival'], ...partial })
      return () => h('div')
    },
  })
  await mountSuspended(Host)
  await waitFor(() => builder.classChoices.value.length > 0)
  return builder
}

describe('Builder — ennemis jurés et terrains favoris du Rôdeur', () => {
  it('niveau 1 : un ennemi et un terrain, exigés pour l\'étape Classe', async () => {
    const builder = await mountBuilder({ level: 1 })

    expect(builder.classChoices.value.map(c => [c.kind, c.count])).toEqual([['favored_enemy', 1], ['terrain', 1]])
    expect(builder.isStepComplete.value('class')).toBe(false)

    builder.state.value.choicePicks = { [ENEMY]: ['Dragons'], [TERRAIN]: ['Forêt'] }
    expect(builder.isStepComplete.value('class')).toBe(true)
    expect(builder.choicePicksPayload.value).toEqual([
      { progressionId: ENEMY, value: 'Dragons' },
      { progressionId: TERRAIN, value: 'Forêt' },
    ])
  })

  it('niveau 6 : deux de chaque, et un seul ne suffit plus', async () => {
    const builder = await mountBuilder({ level: 6 })

    expect(builder.classChoices.value.map(c => [c.kind, c.count])).toEqual([['favored_enemy', 2], ['terrain', 2]])

    builder.state.value.choicePicks = { [ENEMY]: ['Dragons'], [TERRAIN]: ['Forêt', 'Montagne'] }
    expect(builder.isStepComplete.value('class')).toBe(false)

    builder.state.value.choicePicks = { [ENEMY]: ['Dragons', 'Bêtes'], [TERRAIN]: ['Forêt', 'Montagne'] }
    expect(builder.isStepComplete.value('class')).toBe(true)
  })
})
