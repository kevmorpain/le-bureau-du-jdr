import { describe, it, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { useCharacterBuilder, type BuilderState } from '../../app/composables/useCharacterBuilder'
import type { Catalog } from '../../shared/rules/resolve'
import { CLASS_SKILL_CHOICES } from '../../server/db/seeds/data/classSkills'
import { catalogClasses, classSkillProgression } from '../fixtures/catalogClasses'

const classes = catalogClasses()
const idOf = (name: string) => classes.find(c => c.name === name)!.id
const ROUBLARD = idOf('Roublard')
const BARDE = idOf('Barde')

registerEndpoint('/api/catalog/classes', () => classes)
registerEndpoint('/api/catalog/progressions', (): Catalog => ({
  progressions: [classSkillProgression(1, ROUBLARD, 'Roublard'), classSkillProgression(2, BARDE, 'Barde')],
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
      Object.assign(builder.state.value, partial)
      return () => h('div')
    },
  })
  await mountSuspended(Host)
  await waitFor(() => builder.classSkillCount.value > 0)
  return builder
}

describe('Builder — compétences de classe lues dans le catalogue', () => {
  it('Roublard : quatre compétences, dans la liste de la classe', async () => {
    const builder = await mountBuilder({ classId: 'rogue', skills: ['stealth', 'acrobatics', 'deception'] })
    expect(builder.classSkillCount.value).toBe(CLASS_SKILL_CHOICES.Roublard!.count)
    expect(builder.classSkillOptions.value).toEqual(CLASS_SKILL_CHOICES.Roublard!.from)
    expect(builder.isStepComplete.value('class')).toBe(false)

    builder.state.value.skills.push('perception')
    expect(builder.isStepComplete.value('class')).toBe(true)
  })

  it('Barde : la liste « au choix » couvre toutes les compétences', async () => {
    const builder = await mountBuilder({ classId: 'bard', skills: [] })
    expect(builder.classSkillCount.value).toBe(3)
    expect(builder.classSkillOptions.value).toHaveLength(18)
  })
})
