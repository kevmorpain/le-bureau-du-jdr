import { describe, it, expect, beforeAll } from 'vitest'
import { defineComponent, h } from 'vue'
import { getQuery } from 'h3'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import StepSpells from '../../app/components/character_builder/StepSpells.vue'
import { useCharacterBuilder } from '../../app/composables/useCharacterBuilder'

// Le Rôdeur 2014 CONNAÎT ses sorts (table AideDD : 2 au niveau 2, 3 au niveau 3) — il était traité
// comme un lanceur à sorts préparés, sans nombre exigé à la création.

const spell = (id: number, name: string, level: number, className: string) =>
  ({ id, name, level, className, school: { name: 'Evocation' } })

const SPELLS = [
  spell(30, 'Marque du chasseur', 1, 'Rôdeur'),
  spell(31, 'Soins', 1, 'Rôdeur'),
  spell(33, 'Grande foulée', 1, 'Rôdeur'),
  spell(40, 'Bénédiction', 1, 'Paladin'),
  spell(41, 'Châtiment divin', 1, 'Paladin'),
]

beforeAll(() => {
  registerEndpoint('/api/spells', (event) => {
    const { className } = getQuery(event) as { className?: string }
    return className ? SPELLS.filter(s => s.className === className) : SPELLS
  })
  registerEndpoint('/api/invocations', () => [])
})

async function waitFor(condition: () => boolean) {
  for (let i = 0; i < 50 && !condition(); i++) {
    await flushPromises()
    await new Promise(r => setTimeout(r, 10))
  }
  expect(condition()).toBe(true)
}

async function mountBuilderSpells(classId: string, level: number, firstSpellName: string) {
  let builder!: ReturnType<typeof useCharacterBuilder>
  const Host = defineComponent({
    setup() {
      builder = useCharacterBuilder()
      builder.resetBuilder()
      Object.assign(builder.state.value, { classId, level, selectedCantrips: [], selectedSpells: [] })
      return () => h(StepSpells)
    },
  })
  const wrapper = await mountSuspended(Host, { global: { stubs: { UTooltip: { template: '<div><slot /></div>' } } } })
  const text = () => wrapper.text().replace(/\s+/g, ' ')
  await waitFor(() => text().includes(firstSpellName))
  return { builder, text }
}

describe('Builder, étape Sorts — Rôdeur 2014 (sorts connus)', () => {
  it('Rôdeur 2 : onglet « Sorts connus » à 2 sorts, exigés pour valider l\'étape', async () => {
    const { builder, text } = await mountBuilderSpells('ranger', 2, 'Marque du chasseur')

    expect(text()).toMatch(/Sorts connus ?0\/2/)
    expect(text()).not.toContain('Sorts préparés')

    expect(builder.isStepComplete.value('spells')).toBe(false)
    builder.state.value.selectedSpells = [30]
    expect(builder.isStepComplete.value('spells')).toBe(false)
    builder.state.value.selectedSpells = [30, 31]
    expect(builder.isStepComplete.value('spells')).toBe(true)
  })

  it('Rôdeur 3 : 3 sorts connus', async () => {
    const { text } = await mountBuilderSpells('ranger', 3, 'Marque du chasseur')
    expect(text()).toMatch(/Sorts connus ?0\/3/)
  })

  it('témoin Paladin 2 : toujours lanceur à sorts préparés (mod CHA + niveau/2), non exigés', async () => {
    const { builder, text } = await mountBuilderSpells('paladin', 2, 'Bénédiction')

    expect(text()).toContain('Sorts préparés')
    expect(text()).toContain('niveau/2')
    expect(builder.isStepComplete.value('spells')).toBe(true)
  })
})
