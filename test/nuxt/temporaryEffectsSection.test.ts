import { describe, it, expect } from 'vitest'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import TemporaryEffectsSection from '../../app/components/character_sheet/TemporaryEffectsSection.vue'

const SHEET_ID = 9104

registerEndpoint(`/api/character_sheets/${SHEET_ID}/inventory`, () => [])
registerEndpoint(`/api/character_sheets/${SHEET_ID}/proficiency-overrides`, () => [])
registerEndpoint(`/api/character_sheets/${SHEET_ID}/spells`, () => [])
registerEndpoint('/api/backgrounds', () => [])

const sheet = (temporaryEffects: unknown[]) => ({
  id: SHEET_ID,
  baseAbilityScores: [],
  classes: [],
  features: [],
  skills: [],
  abilityScoreImprovements: [],
  species: null,
  temporaryEffects,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any)

describe('TemporaryEffectsSection — rendu', () => {
  it('affiche la description d\'un effet sans mécanique', async () => {
    const wrapper = await mountSuspended(TemporaryEffectsSection, {
      props: { characterSheet: sheet([{ id: 1, name: 'Malédiction', description: 'Ne peut répondre que par oui ou par non', active: true, effects: [] }]) },
    })
    expect(wrapper.text()).toContain('Malédiction')
    expect(wrapper.text()).toContain('Ne peut répondre que par oui ou par non')
  })

  it('un malus actif est rouge, un bonus actif reste dans la couleur primaire, un effet inactif est gris', async () => {
    const wrapper = await mountSuspended(TemporaryEffectsSection, {
      props: { characterSheet: sheet([
        { id: 1, name: 'Mélange', active: true, effects: [
          { type: 'armor_class_bonus', value: { amount: -2 } },
          { type: 'saving_throw_bonus', value: { ability: 'all', amount: 1 } },
        ] },
        { id: 2, name: 'En pause', active: false, effects: [{ type: 'initiative_bonus', value: { amount: -1 } }] },
      ]) },
    })
    const badgeClasses = (label: string) => wrapper.findAll('span').find(s => s.text() === label)!.classes().join(' ')
    expect(badgeClasses('-2 CA')).toContain('error')
    expect(badgeClasses('+1 JS (tous)')).toContain('primary')
    expect(badgeClasses('-1 initiative')).not.toContain('error')
  })
})
