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
  it('affiche le décompte d\'un sort suivi, sa concentration, et la durée d\'un sort qui ne se compte pas', async () => {
    const wrapper = await mountSuspended(TemporaryEffectsSection, {
      props: { characterSheet: sheet([
        { id: 1, name: 'Bénédiction', spellId: 7, concentration: true, active: true, effects: [], countdown: { rounds: 10, remaining: 3 } },
        { id: 2, name: 'Armure du mage', spellId: 8, active: true, effects: [], durationLabel: '8 heures' },
        { id: 3, name: 'Bouclier', spellId: 9, active: false, effects: [{ type: 'armor_class_bonus', value: { amount: 5 } }], countdown: { rounds: 1, remaining: 0 } },
      ]) },
    })
    expect(wrapper.text()).toContain('Concentration')
    expect(wrapper.text()).toContain('Reste 3 rounds sur 10')
    expect(wrapper.text()).toContain('Durée : 8 heures')
    expect(wrapper.text()).toContain('Expiré')
  })
})
