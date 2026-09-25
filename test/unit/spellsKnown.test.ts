import { describe, it, expect } from 'vitest'
import { cantripsKnownAt, spellLearningOf, spellsKnownAt, spellsLearnedOnLevelUp } from '../../shared/rules/spellsKnown'

// Valeurs vérifiées à la main sur les tables de classe AideDD (PHB 2014) et la règle de multiclassage :
// « Vous choisissez les sorts que vous connaissez et que vous préparez pour chacune de vos classes
// individuellement ».

describe('spellsLearnedOnLevelUp — multiclassage (classe prise au niveau 1, fromLevel = 0)', () => {
  it('Occultiste 1 : 2 sorts mineurs et 2 sorts connus', () => {
    expect(spellsLearnedOnLevelUp('warlock', 0, 1)).toEqual({ cantrips: 2, spells: 2 })
  })

  it('Magicien 1 : 3 sorts mineurs et un grimoire de six sorts', () => {
    expect(spellsLearnedOnLevelUp('wizard', 0, 1)).toEqual({ cantrips: 3, spells: 6 })
  })

  it('Clerc 1 : 3 sorts mineurs, aucun sort connu (il prépare)', () => {
    expect(spellsLearnedOnLevelUp('cleric', 0, 1)).toEqual({ cantrips: 3, spells: 0 })
  })

  it('Ensorceleur 1 : 4 sorts mineurs et 2 sorts connus ; Barde 1 : 2 et 4', () => {
    expect(spellsLearnedOnLevelUp('sorcerer', 0, 1)).toEqual({ cantrips: 4, spells: 2 })
    expect(spellsLearnedOnLevelUp('bard', 0, 1)).toEqual({ cantrips: 2, spells: 4 })
  })

  it('Rôdeur et Paladin 1 : rien (incantation au niveau 2)', () => {
    expect(spellsLearnedOnLevelUp('ranger', 0, 1)).toEqual({ cantrips: 0, spells: 0 })
    expect(spellsLearnedOnLevelUp('paladin', 0, 1)).toEqual({ cantrips: 0, spells: 0 })
  })
})

describe('spellsLearnedOnLevelUp — classe déjà possédée', () => {
  it('Occultiste 1→2 : 1 sort connu, pas de sort mineur', () => {
    expect(spellsLearnedOnLevelUp('warlock', 1, 2)).toEqual({ cantrips: 0, spells: 1 })
  })

  it('Occultiste 17→18 : rien (14 sorts connus aux deux niveaux), 18→19 : 1', () => {
    expect(spellsLearnedOnLevelUp('warlock', 17, 18)).toEqual({ cantrips: 0, spells: 0 })
    expect(spellsLearnedOnLevelUp('warlock', 18, 19)).toEqual({ cantrips: 0, spells: 1 })
  })

  it('Magicien : deux sorts de grimoire par niveau, un sort mineur au niveau 4', () => {
    expect(spellsLearnedOnLevelUp('wizard', 1, 2)).toEqual({ cantrips: 0, spells: 2 })
    expect(spellsLearnedOnLevelUp('wizard', 3, 4)).toEqual({ cantrips: 1, spells: 2 })
  })

  it('Rôdeur 2014 : sorts CONNUS — 2 au niveau 2, puis 3 au niveau 3, stable au niveau 4', () => {
    expect(spellLearningOf('ranger')).toBe('known')
    expect(spellsLearnedOnLevelUp('ranger', 1, 2)).toEqual({ cantrips: 0, spells: 2 })
    expect(spellsLearnedOnLevelUp('ranger', 2, 3)).toEqual({ cantrips: 0, spells: 1 })
    expect(spellsLearnedOnLevelUp('ranger', 3, 4)).toEqual({ cantrips: 0, spells: 0 })
  })

  it('Barde 9→10 : 1 sort mineur et 2 sorts (Secrets magiques)', () => {
    expect(spellsLearnedOnLevelUp('bard', 9, 10)).toEqual({ cantrips: 1, spells: 2 })
  })

  it('Clerc 9→10 : 1 sort mineur ; Paladin 1→2 : rien à choisir (il prépare)', () => {
    expect(spellsLearnedOnLevelUp('cleric', 9, 10)).toEqual({ cantrips: 1, spells: 0 })
    expect(spellsLearnedOnLevelUp('paladin', 1, 2)).toEqual({ cantrips: 0, spells: 0 })
  })

  it('classe non lanceuse : rien', () => {
    expect(spellLearningOf('fighter')).toBeNull()
    expect(spellsLearnedOnLevelUp('fighter', 2, 3)).toEqual({ cantrips: 0, spells: 0 })
  })
})

describe('cantripsKnownAt / spellsKnownAt', () => {
  it('niveau 0 (classe pas encore prise) : rien de connu', () => {
    expect(cantripsKnownAt('warlock', 0)).toBe(0)
    expect(spellsKnownAt('warlock', 0)).toBe(0)
    expect(spellsKnownAt('wizard', 0)).toBe(0)
  })

  it('grimoire : 6 au niveau 1, puis +2 par niveau', () => {
    expect(spellsKnownAt('wizard', 1)).toBe(6)
    expect(spellsKnownAt('wizard', 3)).toBe(10) // l'exemple rôdeur 4/magicien 3 d'AideDD : dix sorts
    expect(spellsKnownAt('wizard', 20)).toBe(44)
  })

  it('lanceur à sorts préparés : aucun sort « connu »', () => {
    expect(spellsKnownAt('cleric', 5)).toBe(0)
    expect(spellsKnownAt('druid', 5)).toBe(0)
  })
})
