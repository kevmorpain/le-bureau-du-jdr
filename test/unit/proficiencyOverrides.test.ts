import { describe, expect, it } from 'vitest'
import { withProficiencyOverrides } from '~~/shared/rules/proficiencyOverrides'

describe('withProficiencyOverrides', () => {
  const overrides = [
    { proficiencyType: 'tool', value: 'Outils de voleur', action: 'grant' },
    { proficiencyType: 'tool', value: 'Matériel de calligraphe', action: 'revoke' },
    { proficiencyType: 'language', value: 'elvish', action: 'grant' },
  ]

  it('ajoute les maîtrises accordées à la main et retire celles révoquées', () => {
    expect(withProficiencyOverrides(['Matériel de calligraphe', 'Jeu de dés'], overrides, 'tool'))
      .toEqual(['Jeu de dés', 'Outils de voleur'])
  })

  it('ne lit que les ajouts et retraits du type demandé', () => {
    expect(withProficiencyOverrides(['common'], overrides, 'language')).toEqual(['common', 'elvish'])
  })

  it('ne double pas une maîtrise accordée à la fois par un effet et à la main', () => {
    expect(withProficiencyOverrides(['Outils de voleur'], overrides, 'tool')).toEqual(['Outils de voleur'])
  })

  it('un retrait l\'emporte sur un ajout de la même valeur', () => {
    const both = [
      { proficiencyType: 'weapon', value: 'longsword', action: 'grant' },
      { proficiencyType: 'weapon', value: 'longsword', action: 'revoke' },
    ]
    expect(withProficiencyOverrides([], both, 'weapon')).toEqual([])
  })
})
