import { describe, it, expect } from 'vitest'
import { hitDiceTotals, hitDieSidesOf, recoverHitDice, remainingHitDice, spendHitDice } from '../../shared/rules/hitDice'
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
    expect(recoverHitDice([{ die: '10', count: 0 }], totals)).toEqual([{ die: '10', count: 2 }])
  })

  it('ne dépasse jamais le total', () => {
    expect(recoverHitDice([{ die: '10', count: 4 }], totals)).toEqual([{ die: '10', count: 5 }])
  })

  it('niveau 1 : minimum 1 dé', () => {
    const one = hitDiceTotals([{ level: 1, hitDice: '1d8' }])
    expect(recoverHitDice([{ die: '8', count: 0 }], one)).toEqual([{ die: '8', count: 1 }])
  })

  it('total impair : arrondi à l\'inférieur (11 → 5)', () => {
    const eleven = hitDiceTotals([{ level: 11, hitDice: '1d8' }])
    expect(recoverHitDice([{ die: '8', count: 0 }], eleven)).toEqual([{ die: '8', count: 5 }])
  })

  it('aucun dé dépensé : rien ne change', () => {
    expect(recoverHitDice([{ die: '10', count: 5 }], totals)).toEqual([{ die: '10', count: 5 }])
  })

  it('multiclasse : un seul budget partagé, les plus gros dés d\'abord', () => {
    const multi = hitDiceTotals([{ level: 5, hitDice: '1d10' }, { level: 3, hitDice: '1d6' }])
    expect(recoverHitDice([{ die: '10', count: 0 }, { die: '6', count: 0 }], multi))
      .toEqual([{ die: '10', count: 4 }, { die: '6', count: 0 }])
    expect(recoverHitDice([{ die: '6', count: 0 }, { die: '10', count: 3 }], multi))
      .toEqual([{ die: '6', count: 2 }, { die: '10', count: 5 }])
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

describe('dés de vie — repos court', () => {
  const totals = [{ die: '8' as const, count: 5 }, { die: '10' as const, count: 2 }]

  it('sans suivi, tous les dés restent', () => {
    expect(remainingHitDice(null, totals)).toEqual(totals)
  })

  it('les dés dépensés quittent les dés restants, jamais sous zéro', () => {
    expect(spendHitDice([{ die: '8', count: 3 }, { die: '10', count: 1 }], totals, [
      { die: '8', count: 1 },
      { die: '8', count: 1 },
      { die: '10', count: 4 },
    ])).toEqual([{ die: '8', count: 1 }, { die: '10', count: 0 }])
  })
})
