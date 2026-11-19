import { describe, it, expect } from 'vitest'
import { classCastingOf, firstCastingLevel } from '../../shared/rules/classCasting'
import { classesData } from '../../server/db/seeds/data/classes'

describe('firstCastingLevel', () => {
  it('lanceur complet et magie de pacte : niveau 1 ; demi-lanceur : 2 ; tiers : 3', () => {
    expect(firstCastingLevel('full')).toBe(1)
    expect(firstCastingLevel('pact')).toBe(1)
    expect(firstCastingLevel('half')).toBe(2)
    expect(firstCastingLevel('third')).toBe(3)
  })
})

describe('classCastingOf', () => {
  it('lit le type et la caractéristique de la classe', () => {
    expect(classCastingOf({ spellcastingType: 'half', spellcastingAbility: 'cha' })).toEqual({ ability: 'cha', type: 'half', startsAtLevel: 2 })
  })

  it('une classe qui n\'incante pas par elle-même n\'a pas d\'incantation', () => {
    expect(classCastingOf({ spellcastingType: 'none', spellcastingAbility: null })).toBeNull()
    expect(classCastingOf({ spellcastingType: 'full', spellcastingAbility: null })).toBeNull()
  })

  it('chaque classe lanceuse du seed a une caractéristique d\'incantation', () => {
    for (const cls of classesData.filter(c => c.spellcastingType !== 'none')) {
      expect(classCastingOf(cls), cls.name).not.toBeNull()
    }
  })
})
