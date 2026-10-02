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
  spell(70, 'Bouclier', 1, 'Magicien'),
  spell(71, 'Sommeil', 1, 'Magicien'),
  spell(60, 'Sommeil', 1, 'Barde'),
  spell(61, 'Soins', 1, 'Barde'),
  spell(40, 'Bénédiction', 1, 'Paladin'),
  spell(41, 'Châtiment divin', 1, 'Paladin'),
  ...['Projectile magique', 'Bouclier', 'Sommeil', 'Armure de mage', 'Détection de la magie', 'Mains brûlantes', 'Image silencieuse']
    .map((name, i) => spell(50 + i, name, 1, 'Magicien')),
]

beforeAll(() => {
  registerEndpoint('/api/spells', (event) => {
    const { className } = getQuery(event) as { className?: string }
    return className ? SPELLS.filter(s => s.className === className) : SPELLS
  })
  registerEndpoint('/api/invocations', () => [])
})

async function waitFor(condition: () => boolean) {
  for (let i = 0; i < 200 && !condition(); i++) {
    await flushPromises()
    await new Promise(r => setTimeout(r, 10))
  }
  expect(condition()).toBe(true)
}

async function mountBuilderSpells(classId: string, level: number, firstSpellName: string, extraState: Record<string, unknown> = {}) {
  let builder!: ReturnType<typeof useCharacterBuilder>
  const Host = defineComponent({
    setup() {
      builder = useCharacterBuilder()
      builder.resetBuilder()
      Object.assign(builder.state.value, { classId, level, selectedCantrips: [], selectedSpells: [], ...extraState })
      return () => h(StepSpells)
    },
  })
  const wrapper = await mountSuspended(Host, { global: { stubs: { UTooltip: { template: '<div><slot /></div>' } } } })
  const text = () => wrapper.text().replace(/\s+/g, ' ')
  await waitFor(() => text().includes(firstSpellName))
  const openTab = async (label: string) => {
    await wrapper.findAll('button').find(b => b.text().includes(label))!.trigger('click')
    await flushPromises()
  }
  return { builder, text, openTab }
}

describe('Builder, étape Sorts — grimoire du Magicien', () => {
  it('Magicien 1 : un grimoire de six sorts, exigés pour valider l\'étape (et non « mod + niveau »)', async () => {
    const { builder, text } = await mountBuilderSpells('wizard', 1, 'Grimoire')

    expect(text()).toMatch(/Grimoire ?0\/6/)
    builder.state.value.selectedCantrips = [1, 2, 3]
    expect(builder.isStepComplete.value('spells')).toBe(false)
    builder.state.value.selectedSpells = [50, 51, 52, 53, 54]
    expect(builder.isStepComplete.value('spells')).toBe(false)
    builder.state.value.selectedSpells = [50, 51, 52, 53, 54, 55]
    expect(builder.isStepComplete.value('spells')).toBe(true)
  })

  it('Magicien 3 : dix sorts au grimoire', async () => {
    const { text } = await mountBuilderSpells('wizard', 3, 'Grimoire')
    expect(text()).toMatch(/Grimoire ?0\/10/)
  })

  it('les sorts préparés se choisissent dans le grimoire, au plus mod + niveau, et suivent le grimoire', async () => {
    const { builder, text, openTab } = await mountBuilderSpells('wizard', 1, 'Grimoire')
    await openTab('Grimoire')
    Object.assign(builder.state.value, { selectedSpells: [50, 51, 52], preparedSpells: [] })
    await waitFor(() => /Sorts préparés ?0\/1/.test(text()))

    const { preparedSpells } = builder.state.value
    preparedSpells.push(50)
    await waitFor(() => /Sorts préparés ?1\/1/.test(text()))
  })
})

describe('Builder, étape Sorts — Secrets magiques du Barde', () => {
  it('Barde 10 : 14 sorts connus, dont deux de n\'importe quelle classe, exigés pour valider l\'étape', async () => {
    const { builder, text } = await mountBuilderSpells('bard', 10, 'Sorts connus')

    expect(text()).toMatch(/Sorts connus ?0\/14/)
    expect(builder.freeListPicks.value).toBe(2)
    builder.state.value.selectedCantrips = [1, 2, 3, 4]
    builder.state.value.selectedSpells = Array.from({ length: 13 }, (_, i) => i + 100)
    expect(builder.isStepComplete.value('spells')).toBe(false)
    builder.state.value.selectedSpells = Array.from({ length: 14 }, (_, i) => i + 100)
    expect(builder.isStepComplete.value('spells')).toBe(true)
  })

  it('Barde 9 : 12 sorts connus, aucun Secrets magiques', async () => {
    const { builder, text } = await mountBuilderSpells('bard', 9, 'Sorts connus')
    expect(text()).toMatch(/Sorts connus ?0\/12/)
    expect(builder.freeListPicks.value).toBe(0)
  })

  it('Collège du savoir, niveau 6 : deux sorts de plus que le décompte', async () => {
    const { builder, text } = await mountBuilderSpells('bard', 6, 'Sorts connus', { subclass: 'Collège du savoir' })
    expect(text()).toMatch(/Sorts connus ?0\/11/)
    expect(builder.freeListPicks.value).toBe(2)

    const other = await mountBuilderSpells('bard', 6, 'Sorts connus', { subclass: 'Collège de la vaillance' })
    expect(other.text()).toMatch(/Sorts connus ?0\/9/)
  })
})

describe('Builder, étape Sorts — Chevalier occulte (lanceur du tiers)', () => {
  it('Guerrier 3 du Chevalier occulte : l\'étape Sorts existe, 2 sorts mineurs et 3 sorts, un sort d\'école libre', async () => {
    const { builder } = await mountBuilderSpells('fighter', 3, 'Sorts mineurs', { subclass: 'Chevalier occulte' })

    expect(builder.activeSteps.value.some(step => step.id === 'spells')).toBe(true)
    expect(builder.spellcastingInfo.value).toMatchObject({ type: 'third', ability: 'int' })
    expect(builder.cantripsNeeded.value).toBe(2)
    expect(builder.spellsNeeded.value).toBe(3)
    expect(builder.spellListClassName.value).toBe('Magicien')
    expect(builder.schoolRestriction.value).toMatchObject({ schools: ['Abjuration', 'Evocation'], freePicks: 1 })
    expect(builder.spellSlots.value).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 0])
  })

  it('exige ses sorts pour valider l\'étape', async () => {
    const { builder } = await mountBuilderSpells('fighter', 3, 'Sorts mineurs', { subclass: 'Chevalier occulte' })
    builder.state.value.selectedCantrips = [1, 2]
    expect(builder.isStepComplete.value('spells')).toBe(false)
    builder.state.value.selectedSpells = [70, 71, 72]
    expect(builder.isStepComplete.value('spells')).toBe(true)
  })

  it('Escroc arcanique : trois sorts mineurs (dont Main de mage)', async () => {
    const { builder } = await mountBuilderSpells('rogue', 3, 'Sorts mineurs', { subclass: 'Escroc arcanique' })
    expect(builder.cantripsNeeded.value).toBe(3)
  })

  it('un Guerrier d\'une autre sous-classe, ou avant le niveau 3, n\'a pas d\'étape Sorts', async () => {
    const champion = await mountBuilderSpells('fighter', 3, 'Sorts', { subclass: 'Champion' })
    expect(champion.builder.spellcastingInfo.value).toBeNull()
    expect(champion.builder.activeSteps.value.some(step => step.id === 'spells')).toBe(false)

    const early = await mountBuilderSpells('fighter', 2, 'Sorts', { subclass: 'Chevalier occulte' })
    expect(early.builder.spellcastingInfo.value).toBeNull()
  })
})

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
