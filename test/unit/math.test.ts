import { describe, it, expect } from 'vitest'
import { profBonusAtLevel, abilityMod, formatMod, hpAtLevel } from '../../shared/rules/math'

// Helpers de calcul purs (source unique shared/rules/math.ts depuis le point 6c-3, avant :
// front-only dans app/data/character-builder.ts). On verrouille les formules 2014 contre les
// valeurs de référence du PHB — toute dérive casserait l'affichage builder/level-up/fiche.

describe('profBonusAtLevel', () => {
  it('suit les paliers +2/+3/+4/+5/+6 du PHB 2014', () => {
    // niveau → bonus, aux bornes de chaque palier de 4 niveaux
    const expected: Record<number, number> = {
      1: 2, 4: 2, 5: 3, 8: 3, 9: 4, 12: 4, 13: 5, 16: 5, 17: 6, 20: 6,
    }
    for (const [level, bonus] of Object.entries(expected)) {
      expect(profBonusAtLevel(Number(level))).toBe(bonus)
    }
  })
})

describe('abilityMod', () => {
  it('⌊(score − 10) / 2⌋ sur toute la plage', () => {
    const cases: Array<[number, number]> = [
      [1, -5], [8, -1], [9, -1], [10, 0], [11, 0], [12, 1], [14, 2], [15, 2], [20, 5], [30, 10],
    ]
    for (const [score, mod] of cases) {
      expect(abilityMod(score)).toBe(mod)
    }
  })
})

describe('formatMod', () => {
  it('préfixe un + pour les valeurs positives et nulles', () => {
    expect(formatMod(3)).toBe('+3')
    expect(formatMod(0)).toBe('+0')
    expect(formatMod(5)).toBe('+5')
  })

  it('conserve le signe des valeurs négatives', () => {
    expect(formatMod(-1)).toBe('-1')
    expect(formatMod(-4)).toBe('-4')
  })
})

describe('hpAtLevel', () => {
  it('renvoie 0 pour un niveau ≤ 0', () => {
    expect(hpAtLevel(10, 0, 2)).toBe(0)
    expect(hpAtLevel(10, -1, 2)).toBe(0)
  })

  it('max au niveau 1, puis PV moyens fixes (⌈dé/2⌉ + 1 + mod CON) par niveau', () => {
    expect(hpAtLevel(10, 1, 2)).toBe(12) // d10 + 2
    expect(hpAtLevel(10, 5, 2)).toBe(44) // 12 + 4×8
    expect(hpAtLevel(6, 3, 0)).toBe(14) // d6 : 6 + 2×4
    expect(hpAtLevel(8, 1, -1)).toBe(7) // CON négatif
    expect(hpAtLevel(12, 20, 3)).toBe(205) // barbare d12 +3 CON au niv. 20
  })
})
