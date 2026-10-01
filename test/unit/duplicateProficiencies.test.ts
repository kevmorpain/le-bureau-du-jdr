import { describe, it, expect } from 'vitest'
import { duplicateCount, duplicatedValues } from '../../shared/rules/duplicateProficiencies'

// AideDD, Historiques : une même maîtrise reçue de deux sources ouvre le choix d'une autre de même nature.

describe('maîtrises reçues en double', () => {
  it('Roublard Criminel : les outils de voleur viennent de la classe et de l\'historique', () => {
    expect(duplicatedValues(['Outils de voleur'], ['Jeu de cartes', 'Outils de voleur'])).toEqual(['Outils de voleur'])
    expect(duplicateCount(['Outils de voleur'], ['Jeu de cartes', 'Outils de voleur'])).toBe(1)
  })

  it('une maîtrise reçue de trois sources ouvre deux remplacements', () => {
    expect(duplicateCount(['a'], ['a'], ['a'])).toBe(2)
  })

  it('une source qui répète sa propre maîtrise ne crée pas de doublon', () => {
    expect(duplicateCount(['a', 'a'], ['b'])).toBe(0)
    expect(duplicatedValues(['a', 'a'], ['b'])).toEqual([])
  })
})
