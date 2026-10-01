import { describe, it, expect } from 'vitest'
import { hitDiceTotals, hitDieSidesOf, recoverHitDice } from '../../shared/rules/hitDice'
import { updateCharacterSheetSchema } from '../../shared/utils/character_sheet'

describe('dés de vie — format', () => {
  it('extrait les côtés depuis le format du seed (« 1d10 » → « 10 »)', () => {
    expect(hitDieSidesOf('1d10')).toBe('10')
    expect(hitDieSidesOf('1d6')).toBe('6')
    expect(hitDieSidesOf('d8')).toBeUndefined()
    expect(hitDieSidesOf('1d7')).toBeUndefined()
    expect(hitDieSidesOf(null)).toBeUndefined()
  })

  it('additionne les niveaux des classes qui partagent un dé', () => {
    expect(hitDiceTotals([
      { level: 3, hitDice: '1d10' },
      { level: 2, hitDice: '1d8' },
      { level: 4, hitDice: '1d10' },
    ])).toEqual([{ die: '10', count: 7 }, { die: '8', count: 2 }])
  })
})

describe('dés de vie — repos long', () => {
  const totals = hitDiceTotals([{ level: 5, hitDice: '1d10' }])

  it('rend des dés dépensés (les clés « 10 » de la fiche concordent avec celles du seed)', () => {
    expect(recoverHitDice([{ die: '10', count: 0 }], totals)).toEqual([{ die: '10', count: 3 }])
  })

  it('ne dépasse jamais le total', () => {
    expect(recoverHitDice([{ die: '10', count: 4 }], totals)).toEqual([{ die: '10', count: 5 }])
  })

  it('fiche sans colonne : tous les dés sont disponibles', () => {
    expect(recoverHitDice(null, totals)).toEqual([{ die: '10', count: 5 }])
  })

  it('conserve un dé qui ne correspond plus à aucune classe', () => {
    expect(recoverHitDice([{ die: '6', count: 2 }], totals)).toEqual([{ die: '6', count: 2 }])
  })
})

describe('dés de vie — PUT /character_sheets/:id', () => {
  const sheet = { name: 'Aldric', currentHp: 7 }

  it('conserve les dés dépensés : sinon le PUT répond 200 sans rien écrire', () => {
    const body = { ...sheet, currentHitDie: [{ die: '10', count: 1 }, { die: '8', count: 0 }] }
    expect(updateCharacterSheetSchema.parse(body).currentHitDie).toEqual(body.currentHitDie)
  })

  it('accepte null : le client renvoie la fiche brute, et les fiches antérieures à la colonne l\'ont à NULL', () => {
    expect(updateCharacterSheetSchema.safeParse({ ...sheet, currentHitDie: null }).success).toBe(true)
  })

  it('refuse un dé inconnu, un compte négatif ou supérieur au niveau max', () => {
    for (const currentHitDie of [[{ die: '7', count: 1 }], [{ die: '8', count: -1 }], [{ die: '8', count: 21 }]]) {
      expect(updateCharacterSheetSchema.safeParse({ ...sheet, currentHitDie }).success).toBe(false)
    }
  })
})
