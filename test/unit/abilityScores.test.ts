import { describe, it, expect } from 'vitest'
import { resolveAbilityScore, type AbilityScoreInput } from '../../shared/rules/abilityScores'

// Valeurs vérifiées à la main contre les textes AideDD : ASI et demi-dons plafonnés à 20, Champion
// primitif (+4, maximum 24), Pierre de Ioun (+2, « pour un total maximum de 20 »), Gantelets de
// puissance d'ogre (Force 19, sans effet à 19 ou plus), Ceinturon de force de géant (21 à 29).

const score = (over: Partial<AbilityScoreInput>) => resolveAbilityScore({
  base: 10,
  naturalBonus: 0,
  maxIncrease: 0,
  itemIncreases: [],
  itemSets: [],
  ...over,
})

describe('resolveAbilityScore — score naturel', () => {
  it('additionne base et bonus sous le maximum de 20', () => {
    expect(score({ base: 15, naturalBonus: 2 })).toEqual({ maximum: 20, natural: 17, total: 17 })
  })

  it('plafonne un demi-don pris sur un score déjà à 20 (base 18 + espèce 2 + don 1)', () => {
    expect(score({ base: 18, naturalBonus: 3 })).toEqual({ maximum: 20, natural: 20, total: 20 })
  })

  it('Champion primitif : FOR 20 + 4 avec maximum relevé de 4 → 24', () => {
    expect(score({ base: 15, naturalBonus: 5 + 4, maxIncrease: 4 })).toEqual({ maximum: 24, natural: 24, total: 24 })
  })

  it('Manuel de vitalité : CON 20 + 2 avec maximum relevé de 2 → 22', () => {
    expect(score({ base: 18, naturalBonus: 2 + 2, maxIncrease: 2 })).toEqual({ maximum: 22, natural: 22, total: 22 })
  })

  it('ne baisse jamais une base saisie au-delà du maximum', () => {
    expect(score({ base: 22, naturalBonus: 2 })).toEqual({ maximum: 20, natural: 22, total: 22 })
  })

  it('applique un malus même au-dessus du maximum', () => {
    expect(score({ base: 10, naturalBonus: -2 })).toEqual({ maximum: 20, natural: 8, total: 8 })
  })
})

describe('resolveAbilityScore — objets', () => {
  it('Pierre de Ioun (+2, max 20) : 17 → 19, 19 → 20', () => {
    expect(score({ base: 17, itemIncreases: [{ amount: 2, max: 20 }] }).total).toBe(19)
    expect(score({ base: 19, itemIncreases: [{ amount: 2, max: 20 }] }).total).toBe(20)
  })

  it('Pierre de Ioun sur un Barbare 20 à FOR 21 : sans effet, sans baisser le score', () => {
    expect(score({ base: 21, maxIncrease: 4, itemIncreases: [{ amount: 2, max: 20 }] }).total).toBe(21)
  })

  it('bonus d\'objet sans maximum propre : borné par le maximum du personnage', () => {
    expect(score({ base: 19, itemIncreases: [{ amount: 2 }] }).total).toBe(20)
    expect(score({ base: 19, maxIncrease: 4, itemIncreases: [{ amount: 2 }] }).total).toBe(21)
  })

  it('Gantelets de puissance d\'ogre : FOR 15 → 19, FOR 20 inchangée', () => {
    expect(score({ base: 15, itemSets: [19] })).toEqual({ maximum: 20, natural: 15, total: 19 })
    expect(score({ base: 20, itemSets: [19] }).total).toBe(20)
  })

  it('Ceinturon de force de géant (21) : dépasse le maximum (FOR 20 → 21)', () => {
    expect(score({ base: 20, itemSets: [21] }).total).toBe(21)
  })

  it('plusieurs scores fixés : le plus haut l\'emporte', () => {
    expect(score({ base: 15, itemSets: [19, 21] }).total).toBe(21)
  })

  it('score fixé appliqué après les bonus : Ioun (15 → 17) puis Gantelets → 19', () => {
    expect(score({ base: 15, itemIncreases: [{ amount: 2, max: 20 }], itemSets: [19] }).total).toBe(19)
  })
})
