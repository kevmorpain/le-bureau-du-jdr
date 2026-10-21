import { describe, it, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { useCharacterBuilder, type BuilderState } from '../../app/composables/useCharacterBuilder'
import type { Catalog } from '../../shared/rules/resolve'
import { guerrierSubclasses } from '../../server/db/seeds/data/guerrier'
import { catalogClasses, classSkillProgression } from '../fixtures/catalogClasses'

// Maître de guerre : le builder demande les manœuvres, en nombre selon le niveau, et l'outil de Disciple martial.

const GUERRIER = 5
const MASTER = 50
const MANEUVER_IDS = Array.from({ length: 16 }, (_, i) => 100 + i)
const TOOL = 'Outils de forgeron'
const MANEUVERS_PROGRESSION = 8
const TOOL_PROGRESSION = 9

const seed = guerrierSubclasses.find(s => s.name === 'Maître de guerre')!
const progressionOf = (name: string) => seed.features.find(f => f.name === name)!.progression!

registerEndpoint('/api/catalog/classes', () => [{
  id: GUERRIER,
  name: 'Guerrier',
  subclassLevel: 3,
  subclasses: [{ id: MASTER, name: 'Maître de guerre' }],
  proficiencies: catalogClasses().find(c => c.name === 'Guerrier')!.proficiencies,
}])
registerEndpoint('/api/catalog/progressions', (): Catalog => ({
  progressions: [
    classSkillProgression(99, GUERRIER, 'Guerrier'),
    {
      progressionId: 3,
      ownerClassId: GUERRIER,
      ownerLevelRequired: 3,
      kind: 'subclass',
      count: { op: 'fixed', value: 1 },
      optionSource: { type: 'subclasses' },
      replaceable: false,
      options: [{ subclassId: MASTER }],
    },
    {
      progressionId: MANEUVERS_PROGRESSION,
      ownerClassId: GUERRIER,
      ownerSubclassId: MASTER,
      ownerLevelRequired: 3,
      ...progressionOf('Supériorité martiale'),
      replaceable: true,
      options: MANEUVER_IDS.map(featureId => ({ featureId })),
    },
    {
      progressionId: TOOL_PROGRESSION,
      ownerClassId: GUERRIER,
      ownerSubclassId: MASTER,
      ownerLevelRequired: 3,
      ...progressionOf('Disciple martial'),
      replaceable: false,
      options: [{ value: TOOL }],
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
      Object.assign(builder.state.value, { classId: 'fighter', skills: ['athletics', 'perception'], subclass: 'Maître de guerre', ...partial })
      return () => h('div')
    },
  })
  await mountSuspended(Host)
  await waitFor(() => builder.featurePickChoices.value.length > 0)
  return builder
}

describe('Builder — Maître de guerre', () => {
  // Le builder partage son état entre les montages : chaque cas se lit avant le suivant.
  it('niveau 3 : trois manœuvres et un outil d\'artisan, exigés pour l\'étape Classe', async () => {
    const builder = await mountBuilder({ level: 3 })

    expect(builder.featurePickChoices.value.map(c => [c.kind, c.count])).toEqual([['maneuvers', 3]])
    expect(builder.classChoices.value.map(c => [c.kind, c.count])).toEqual([['tool', 1]])
    expect(builder.isStepComplete.value('class')).toBe(false)

    builder.state.value.featurePicks = { [MANEUVERS_PROGRESSION]: MANEUVER_IDS.slice(0, 3) }
    expect(builder.isStepComplete.value('class')).toBe(false)

    builder.state.value.choicePicks = { [TOOL_PROGRESSION]: [TOOL] }
    expect(builder.isStepComplete.value('class')).toBe(true)
    expect(builder.featurePicksPayload.value).toHaveLength(3)
    expect(builder.choicePicksPayload.value).toEqual([{ progressionId: TOOL_PROGRESSION, value: TOOL }])
  })

  it('niveau 7 : cinq manœuvres, et trois ne suffisent plus', async () => {
    const builder = await mountBuilder({ level: 7 })

    expect(builder.featurePickChoices.value.map(c => c.count)).toEqual([5])
    builder.state.value.choicePicks = { [TOOL_PROGRESSION]: [TOOL] }
    builder.state.value.featurePicks = { [MANEUVERS_PROGRESSION]: MANEUVER_IDS.slice(0, 3) }
    expect(builder.isStepComplete.value('class')).toBe(false)

    builder.state.value.featurePicks = { [MANEUVERS_PROGRESSION]: MANEUVER_IDS.slice(0, 5) }
    expect(builder.isStepComplete.value('class')).toBe(true)
  })
})
