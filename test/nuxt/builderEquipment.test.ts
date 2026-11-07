import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import StepEquipment from '../../app/components/character_builder/StepEquipment.vue'
import { useCharacterBuilder, type BuilderState } from '../../app/composables/useCharacterBuilder'
import { itemsData } from '../../server/db/seeds/data/items'
import { catalogClasses } from '../fixtures/catalogClasses'

registerEndpoint('/api/items', () => itemsData.map(i => ({ ...i, isCustom: false })))
registerEndpoint('/api/catalog/classes', catalogClasses)

function buildCharacter(partial: Partial<BuilderState>) {
  const builder = useCharacterBuilder()
  builder.resetBuilder()
  Object.assign(builder.state.value, { name: 'Test', level: 1, alignment: 'N', ...partial })
  return builder
}

const buttonLabels = (wrapper: { findAll: (s: string) => Array<{ text: () => string }> }) =>
  wrapper.findAll('button').map(b => b.text())

describe('StepEquipment — Rôdeur Acolyte', () => {
  beforeEach(() => buildCharacter({ raceId: 'human', classId: 'ranger', backgroundId: 'acolyte' }))

  it('liste les options de la classe telles que les écrit AideDD, sacs compris', async () => {
    const wrapper = await mountSuspended(StepEquipment)
    const labels = buttonLabels(wrapper)
    expect(labels).toContain('Armure d\'écailles')
    expect(labels).toContain('Sac d\'exploration souterraine')
    expect(labels).toContain('Sac d\'explorateur')
    expect(labels).toContain('Épée courte ×2')
  })

  it('montre le contenu du sac choisi', async () => {
    const wrapper = await mountSuspended(StepEquipment)
    expect(wrapper.text()).toContain('Sac d\'exploration souterraine : Sac à dos · Pied-de-biche · Marteau · Piton ×10 · Torche ×10')
  })

  it('exige le symbole sacré de l\'Acolyte avant de valider l\'étape, et le range au bon nom', async () => {
    const builder = useCharacterBuilder()
    const wrapper = await mountSuspended(StepEquipment)
    expect(builder.startingEquipment.value.missingPicks).toHaveLength(1)

    await vi.waitFor(() => expect(buttonLabels(wrapper)).toContain('Symbole sacré (amulette)'))
    await wrapper.findAll('button').find(b => b.text() === 'Symbole sacré (amulette)')!.trigger('click')

    expect(builder.startingEquipment.value.missingPicks).toEqual([])
    expect(builder.startingEquipment.value.lines).toContainEqual({ name: 'Symbole sacré (amulette)', quantity: 1 })
    expect(builder.startingEquipment.value.po).toBe(15)
  })

  it('l\'autre option du groupe remplace les objets de la première', async () => {
    const builder = useCharacterBuilder()
    const wrapper = await mountSuspended(StepEquipment)
    await wrapper.findAll('button').find(b => b.text() === 'Arme courante de corps à corps ×2')!.trigger('click')
    expect(builder.startingEquipment.value.lines.map(l => l.name)).not.toContain('Épée courte')
    expect(builder.startingEquipment.value.missingPicks.length).toBeGreaterThan(1)
  })
})

describe('StepEquipment — changer de classe', () => {
  it('ne garde pas les choix d\'objet de la classe précédente', async () => {
    const builder = buildCharacter({ raceId: 'human', classId: 'wizard', backgroundId: 'criminal' })
    builder.state.value.equipmentSelection.options['class:wizard:1'] = 1
    builder.state.value.equipmentSelection.picks['class:wizard:1:1:0'] = 'Focaliseur arcanique (orbe)'
    expect(builder.startingEquipment.value.lines.map(l => l.name)).toContain('Focaliseur arcanique (orbe)')

    builder.state.value.classId = 'sorcerer'
    expect(builder.startingEquipment.value.lines.map(l => l.name)).not.toContain('Focaliseur arcanique (orbe)')
  })
})
