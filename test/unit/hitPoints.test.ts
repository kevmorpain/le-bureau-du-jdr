import { describe, it, expect } from 'vitest'
import {
  averageBaseHitPoints,
  averageHitDieValue,
  baseHitPoints,
  baseHitPointsBounds,
  hitPointGain,
  hitPointsPerLevelBonus,
  hpBaseFromTotal,
  maxHitPoints,
} from '../../shared/rules/hitPoints'

// Valeurs vérifiées contre AideDD, « Au-delà du niveau 1 » : le dé de vie plus le modificateur de CON s'ajoute à
// chaque niveau (minimum 1) ; la valeur fixe est la moyenne arrondie au supérieur ; quand le modificateur de CON
// augmente de 1, le maximum augmente de 1 par niveau atteint (Bruenor : CON 17 → 18 au niveau 8, +8 PV).

describe('averageHitDieValue', () => {
  it('moyenne arrondie au supérieur : d6 → 4, d8 → 5, d10 → 6, d12 → 7', () => {
    expect([6, 8, 10, 12].map(averageHitDieValue)).toEqual([4, 5, 6, 7])
  })
})

describe('hitPointGain', () => {
  it('garde le dé tant que dé + CON reste au moins à 1', () => {
    expect(hitPointGain(5, 2)).toBe(5)
    expect(hitPointGain(4, -3)).toBe(4)
  })

  it('relève la part stockée de ce qui manque pour que dé + CON fasse 1 (minimum 1 PV par niveau)', () => {
    expect(hitPointGain(1, -3)).toBe(4) // 4 − 3 = 1
    expect(hitPointGain(2, -5)).toBe(6)
  })
})

describe('baseHitPoints', () => {
  it('niveau 1 au maximum du dé, puis les valeurs des niveaux suivants', () => {
    expect(baseHitPoints(10, [], 0)).toBe(10)
    expect(baseHitPoints(8, [3, 8, 1], 0)).toBe(8 + 3 + 8 + 1)
  })

  it('moyennes fixes : d10 niveau 5 → 10 + 4 × 6', () => {
    expect(averageBaseHitPoints(10, 5, 0)).toBe(34)
    expect(averageBaseHitPoints(12, 1, 0)).toBe(12)
    expect(averageBaseHitPoints(6, 3, 0)).toBe(6 + 2 * 4)
  })

  it('un modificateur de CON très négatif relève chaque niveau à 1 PV de maximum', () => {
    // d6, CON −5 : niveau 1 → 6 − 5 = 1 ; niveaux suivants : moyenne 4 relevée à 6 → 1 PV chacun.
    expect(averageBaseHitPoints(6, 3, -5)).toBe(6 + 6 + 6)
    expect(maxHitPoints({ hpBase: 18, totalLevel: 3, conMod: -5, perLevelBonus: 0, exhaustionLevel: 0 })).toBe(3)
  })
})

describe('baseHitPointsBounds', () => {
  it('1 PV par niveau au plus bas, le dé maximal à chaque niveau au plus haut', () => {
    expect(baseHitPointsBounds(10, 4)).toEqual({ min: 4, max: 40 })
  })
})

describe('maxHitPoints', () => {
  const sheet = { hpBase: 30, totalLevel: 4, conMod: 3, perLevelBonus: 2, exhaustionLevel: 0 }

  it('part des dés + (CON + bonus par niveau) × niveau', () => {
    expect(maxHitPoints(sheet)).toBe(30 + (3 + 2) * 4)
  })

  it('Bruenor : le modificateur de CON passe de +3 à +4 au niveau 8, le maximum gagne 8', () => {
    const at = (conMod: number) => maxHitPoints({ hpBase: 60, totalLevel: 8, conMod, perLevelBonus: 0, exhaustionLevel: 0 })
    expect(at(4) - at(3)).toBe(8)
  })

  it('la CON compte sur le niveau total, multiclasse compris', () => {
    expect(maxHitPoints({ hpBase: 20, totalLevel: 5, conMod: 2, perLevelBonus: 0, exhaustionLevel: 0 })).toBe(30)
  })

  it('épuisement 4 : maximum divisé par deux, arrondi à l\'inférieur ; avant, aucun effet', () => {
    expect(maxHitPoints({ ...sheet, exhaustionLevel: 3 })).toBe(50)
    expect(maxHitPoints({ ...sheet, exhaustionLevel: 4 })).toBe(25)
    expect(maxHitPoints({ ...sheet, hpBase: 31, exhaustionLevel: 5 })).toBe(25)
  })

  it('un malus de CON ne fait jamais passer le maximum sous 1', () => {
    expect(maxHitPoints({ hpBase: 2, totalLevel: 4, conMod: -5, perLevelBonus: 0, exhaustionLevel: 0 })).toBe(1)
  })
})

describe('hpBaseFromTotal', () => {
  it('retire la CON et les bonus par niveau du total saisi, et maxHitPoints le restitue', () => {
    const hpBase = hpBaseFromTotal(50, 4, 3, 2)
    expect(hpBase).toBe(30)
    expect(maxHitPoints({ hpBase, totalLevel: 4, conMod: 3, perLevelBonus: 2, exhaustionLevel: 0 })).toBe(50)
  })
})

describe('hitPointsPerLevelBonus', () => {
  it('additionne les effets hp_per_level (Robuste : +2) et ignore les autres', () => {
    expect(hitPointsPerLevelBonus([
      { type: 'hp_per_level', value: { amount: 2 } },
      { type: 'hp_per_level', value: { amount: 1 } },
      { type: 'initiative_bonus', value: { amount: 5 } },
    ])).toBe(3)
    expect(hitPointsPerLevelBonus([])).toBe(0)
  })
})
