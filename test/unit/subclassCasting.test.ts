import { describe, it, expect } from 'vitest'
import { anySchoolSpellsGained, casterSlugOf, effectiveCasterType, subclassCastingOf } from '../../shared/rules/subclassCasting'
import { cantripsKnownAt, spellLearningOf, spellsKnownAt, spellsLearnedOnLevelUp } from '../../shared/rules/spellsKnown'

// Chevalier occulte et Escroc arcanique : tables vérifiées sur AideDD (Guerrier, Roublard).

describe('sous-classes lanceuses du tiers', () => {
  it('reconnues par nom, seulement sur leur classe', () => {
    expect(subclassCastingOf('fighter', 'Chevalier occulte')?.slug).toBe('eldritch_knight')
    expect(subclassCastingOf('rogue', 'Escroc arcanique')?.slug).toBe('arcane_trickster')
    expect(subclassCastingOf('rogue', 'Chevalier occulte')).toBeNull()
    expect(subclassCastingOf('fighter', 'Champion')).toBeNull()
    expect(subclassCastingOf('fighter', null)).toBeNull()
  })

  it('la clé des tables : la sous-classe lanceuse, sinon la classe', () => {
    expect(casterSlugOf('fighter', 'Chevalier occulte')).toBe('eldritch_knight')
    expect(casterSlugOf('fighter', 'Champion')).toBe('fighter')
    expect(casterSlugOf('wizard', null)).toBe('wizard')
  })

  it('un Guerrier ou un Roublard n\'incante qu\'à travers sa sous-classe', () => {
    expect(effectiveCasterType('none', 'fighter', 'Chevalier occulte')).toBe('third')
    expect(effectiveCasterType('none', 'fighter', 'Champion')).toBe('none')
    expect(effectiveCasterType('full', 'wizard', null)).toBe('full')
  })
})

describe('sorts connus des sous-classes du tiers', () => {
  it('ils connaissent leurs sorts, comme un Barde', () => {
    expect(spellLearningOf('eldritch_knight')).toBe('known')
    expect(spellLearningOf('arcane_trickster')).toBe('known')
  })

  it('Chevalier occulte : 2 sorts mineurs et 3 sorts au niveau 3, 3 sorts mineurs au niveau 10, 13 sorts au niveau 20', () => {
    expect(spellsLearnedOnLevelUp('eldritch_knight', 2, 3)).toEqual({ cantrips: 2, spells: 3 })
    expect(cantripsKnownAt('eldritch_knight', 9)).toBe(2)
    expect(cantripsKnownAt('eldritch_knight', 10)).toBe(3)
    expect(spellsKnownAt('eldritch_knight', 20)).toBe(13)
  })

  it('Escroc arcanique : un sort mineur de plus (Main de mage), mêmes sorts connus', () => {
    expect(spellsLearnedOnLevelUp('arcane_trickster', 2, 3)).toEqual({ cantrips: 3, spells: 3 })
    expect(cantripsKnownAt('arcane_trickster', 10)).toBe(4)
    for (let level = 1; level <= 20; level++) {
      expect(spellsKnownAt('arcane_trickster', level)).toBe(spellsKnownAt('eldritch_knight', level))
    }
  })

  it('la table des sorts connus : 3, 4, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13 du niveau 3 au niveau 20', () => {
    const known = Array.from({ length: 18 }, (_, i) => spellsKnownAt('eldritch_knight', i + 3))
    expect(known).toEqual([3, 4, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13])
    expect(spellsKnownAt('eldritch_knight', 2)).toBe(0)
  })

  it('un nouveau sort par niveau seulement quand la table monte', () => {
    expect(spellsLearnedOnLevelUp('eldritch_knight', 3, 4).spells).toBe(1)
    expect(spellsLearnedOnLevelUp('eldritch_knight', 4, 5).spells).toBe(0)
    expect(spellsLearnedOnLevelUp('eldritch_knight', 7, 8).spells).toBe(1)
  })
})

describe('anySchoolSpellsGained — sorts d\'école libre', () => {
  it('un sort au niveau 3 (le troisième des sorts de niveau 1), puis un aux niveaux 8, 14 et 20', () => {
    expect(anySchoolSpellsGained(2, 3)).toBe(1)
    expect(anySchoolSpellsGained(7, 8)).toBe(1)
    expect(anySchoolSpellsGained(13, 14)).toBe(1)
    expect(anySchoolSpellsGained(19, 20)).toBe(1)
  })

  it('aucun aux autres niveaux, tous franchis à la création', () => {
    expect(anySchoolSpellsGained(3, 4)).toBe(0)
    expect(anySchoolSpellsGained(8, 9)).toBe(0)
    expect(anySchoolSpellsGained(0, 20)).toBe(4)
    expect(anySchoolSpellsGained(0, 9)).toBe(2)
  })
})
