import { describe, it, expect } from 'vitest'
import { SpellComponent } from '../../server/db/schema/spells'
import { matchesSpellFilters } from '../../app/utils/spellFilters'

const spell = (name: string, castingTime: string, components: SpellComponent[] = [SpellComponent.Vocal], level = 1) =>
  ({ name, castingTime, components, level })

const healingWord = spell('Mot de guérison', '1 action bonus')
const shield = spell('Bouclier', '1 réaction', [SpellComponent.Vocal, SpellComponent.Somatic])
const fireBolt = spell('Trait de feu', '1 action', [SpellComponent.Vocal, SpellComponent.Somatic], 0)
const all = [healingWord, shield, fireBolt]

const namesMatching = (filters: Parameters<typeof matchesSpellFilters>[1]) =>
  all.filter(s => matchesSpellFilters(s, filters)).map(s => s.name)

describe('matchesSpellFilters', () => {
  it('le filtre Bonus garde les sorts à action bonus', () => {
    expect(namesMatching({ cost: 'bonus' })).toEqual(['Mot de guérison'])
  })

  it('le filtre Action écarte les réactions et les actions bonus', () => {
    expect(namesMatching({ cost: 'action' })).toEqual(['Trait de feu'])
  })

  it('le filtre Réaction garde les réactions', () => {
    expect(namesMatching({ cost: 'reaction' })).toEqual(['Bouclier'])
  })

  it('les composantes demandées doivent toutes y être', () => {
    expect(namesMatching({ components: [SpellComponent.Somatic] })).toEqual(['Bouclier', 'Trait de feu'])
  })

  it('recherche sans accents ni casse, et niveaux', () => {
    expect(namesMatching({ search: 'guerison' })).toEqual(['Mot de guérison'])
    expect(namesMatching({ levels: [0] })).toEqual(['Trait de feu'])
  })

  it('sans filtre, tout passe', () => {
    expect(namesMatching({})).toEqual(['Mot de guérison', 'Bouclier', 'Trait de feu'])
  })
})
