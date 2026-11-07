import { describe, it, expect } from 'vitest'
import {
  carriedWeightG,
  carryingCapacityG,
  encumbranceOf,
  encumbranceSpeedPenalty,
  formatWeightKg,
  isCarried,
  isHeavilyEncumbered,
  stackWeightG,
} from '../../shared/rules/encumbrance'
import { COIN_VALUE_CP, coinCount, formatCostCp, purseValueCp } from '../../shared/rules/currency'

const stack = (quantity: number, weightG: number | null, over: { lotSize?: number, carried?: boolean } = {}) =>
  ({ quantity, weightG, lotSize: over.lotSize ?? 1, carried: over.carried ?? true })

describe('capacité de charge', () => {
  it('vaut la Force × 7,5 kg', () => {
    expect(carryingCapacityG(10, 'M')).toBe(75000)
    expect(carryingCapacityG(16, 'S')).toBe(120000)
  })

  it('double par catégorie au-delà de Moyenne, et se réduit de moitié pour Très petite', () => {
    expect(carryingCapacityG(10, 'L')).toBe(150000)
    expect(carryingCapacityG(10, 'H')).toBe(300000)
    expect(carryingCapacityG(10, 'G')).toBe(600000)
    expect(carryingCapacityG(10, 'T')).toBe(37500)
  })

  it('une taille inconnue compte pour Moyenne', () => {
    expect(carryingCapacityG(10, null)).toBe(75000)
  })
})

describe('poids porté', () => {
  it('additionne quantités et poids, pièces comprises (100 pièces = 1 kg)', () => {
    expect(carriedWeightG([stack(2, 2500), stack(1, 27500)], 0)).toBe(32500)
    expect(carriedWeightG([], 250)).toBe(2500)
  })

  it('un lot se partage entre ses unités : 7 carreaux d\'un lot de 20 pesant 750 g', () => {
    expect(stackWeightG(stack(7, 750, { lotSize: 20 }))).toBe(262.5)
    expect(carriedWeightG([stack(20, 750, { lotSize: 20 })], 0)).toBe(750)
  })

  it('un objet sans poids compte pour rien', () => {
    expect(stackWeightG(stack(3, null))).toBe(0)
  })

  it('monture et véhicule ne se portent pas', () => {
    expect(isCarried('equipment', 'Monture')).toBe(false)
    expect(isCarried('equipment', 'Véhicule')).toBe(false)
    expect(isCarried('equipment', 'Outil')).toBe(true)
    expect(isCarried('weapon', undefined)).toBe(true)
    expect(carriedWeightG([stack(1, 100000, { carried: false }), stack(1, 2000)], 0)).toBe(2000)
  })
})

describe('variante d\'encombrement', () => {
  // Force 10 : encombré au-delà de 25 kg, fortement encombré au-delà de 50 kg, capacité 75 kg.
  it('tient les seuils à 2,5 et 5 fois la Force en kilogrammes', () => {
    expect(encumbranceOf(25000, 10, 'M').level).toBe('none')
    expect(encumbranceOf(25001, 10, 'M').level).toBe('encumbered')
    expect(encumbranceOf(50000, 10, 'M').level).toBe('encumbered')
    expect(encumbranceOf(50001, 10, 'M').level).toBe('heavily')
    expect(encumbranceOf(75000, 10, 'M').level).toBe('heavily')
    expect(encumbranceOf(75001, 10, 'M').level).toBe('overloaded')
  })

  it('une créature Très petite dépasse sa capacité avant d\'être fortement encombrée', () => {
    expect(encumbranceOf(40000, 10, 'T').level).toBe('overloaded')
  })

  it('retire 3 m, 6 m puis 6 m à la vitesse ; seul le niveau fort donne le désavantage', () => {
    expect(encumbranceSpeedPenalty('none')).toBe(0)
    expect(encumbranceSpeedPenalty('encumbered')).toBe(3)
    expect(encumbranceSpeedPenalty('heavily')).toBe(6)
    expect(encumbranceSpeedPenalty('overloaded')).toBe(6)
    expect(isHeavilyEncumbered('encumbered')).toBe(false)
    expect(isHeavilyEncumbered('heavily')).toBe(true)
    expect(isHeavilyEncumbered('overloaded')).toBe(true)
  })
})

describe('affichage', () => {
  it('écrit les poids en kilogrammes à la française', () => {
    expect(formatWeightKg(2500)).toBe('2,5 kg')
    expect(formatWeightKg(125)).toBe('0,13 kg')
    expect(formatWeightKg(75000)).toBe('75 kg')
  })
})

describe('monnaie', () => {
  it('suit le change standard : 1 po = 10 pa = 100 pc et 1 pp = 10 po = 20 pe', () => {
    expect(COIN_VALUE_CP.po).toBe(10 * COIN_VALUE_CP.pa)
    expect(COIN_VALUE_CP.po).toBe(100 * COIN_VALUE_CP.pc)
    expect(COIN_VALUE_CP.pp).toBe(10 * COIN_VALUE_CP.po)
    expect(COIN_VALUE_CP.pp).toBe(20 * COIN_VALUE_CP.pe)
  })

  it('compte les pièces et leur valeur, une bourse incomplète comprise', () => {
    expect(coinCount({ pp: 1, po: 5, pe: 0, pa: 3, pc: 2 })).toBe(11)
    expect(purseValueCp({ pp: 1, po: 5, pe: 2, pa: 3, pc: 2 })).toBe(1000 + 500 + 100 + 30 + 2)
    expect(coinCount({ po: 4 })).toBe(4)
  })

  it('écrit un prix dans la plus grande pièce qui le rend exactement', () => {
    expect(formatCostCp(2500)).toBe('25 po')
    expect(formatCostCp(20)).toBe('2 pa')
    expect(formatCostCp(5)).toBe('5 pc')
    expect(formatCostCp(150)).toBe('15 pa')
  })
})
