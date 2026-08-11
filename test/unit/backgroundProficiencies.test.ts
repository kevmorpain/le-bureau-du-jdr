import { describe, it, expect } from 'vitest'
import { isChoiceProficiency, fixedProficiencies } from '../../shared/rules/backgroundProficiencies'

// Volet B, étape 2 — critère FIXE vs AU CHOIX des maîtrises d'historique (source unique, partagée
// entre le seed des porteurs dérivables et createCharacter). On verrouille le classement pour que
// « dérivé == stocké ».

describe('isChoiceProficiency', () => {
  it('classe les maîtrises FIXES (ni « choix » ni « × »)', () => {
    for (const fixed of ['Kit de déguisement', 'Kit de contrefaçon', 'Outils de voleur', 'Kit d\'herboriste', 'Outils de navigateur', 'Véhicules terrestres', 'Véhicules aquatiques']) {
      expect(isChoiceProficiency(fixed), fixed).toBe(false)
    }
  })

  it('classe les PLACEHOLDERS de choix (« choix » ou « × »)', () => {
    for (const choice of ['Jeux au choix ×1', 'Instrument de musique au choix', 'Outil d\'artisan au choix', 'Au choix ×2', 'Au choix ×1']) {
      expect(isChoiceProficiency(choice), choice).toBe(true)
    }
  })

  it('détecte « × » même sans le mot « choix »', () => {
    expect(isChoiceProficiency('Quelque chose ×3')).toBe(true)
  })
})

describe('fixedProficiencies', () => {
  it('ne garde que les entrées fixes d\'une liste mixte', () => {
    expect(fixedProficiencies(['Jeux au choix ×1', 'Outils de voleur'])).toEqual(['Outils de voleur'])
    expect(fixedProficiencies(['Outil d\'artisan au choix', 'Véhicules terrestres'])).toEqual(['Véhicules terrestres'])
  })

  it('rend [] quand tout est au choix (ex. langues 2014)', () => {
    expect(fixedProficiencies(['Au choix ×2'])).toEqual([])
    expect(fixedProficiencies([])).toEqual([])
  })
})
