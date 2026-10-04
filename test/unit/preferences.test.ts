import { describe, it, expect } from 'vitest'
import { PREFERENCE_KEYS, PREFERENCES, preferencesSchema, resolvePreferences } from '../../shared/rules/preferences'
import { updateCharacterSheetSchema } from '../../shared/utils/character_sheet'

// D18 : `fiche ?? compte ?? défaut codé`, où une clé absente — et non `false` — veut dire « hérite ».

describe('resolvePreferences — héritage live', () => {
  it('sans rien de posé, le défaut codé s\'applique (jets activés)', () => {
    expect(resolvePreferences(null, null)).toEqual({ diceRolls: true })
    expect(resolvePreferences(undefined, {})).toEqual({ diceRolls: true })
  })

  it('le compte l\'emporte sur le défaut codé, la fiche sur le compte', () => {
    expect(resolvePreferences(null, { diceRolls: false }).diceRolls).toBe(false)
    expect(resolvePreferences({ diceRolls: true }, { diceRolls: false }).diceRolls).toBe(true)
    expect(resolvePreferences({ diceRolls: false }, { diceRolls: true }).diceRolls).toBe(false)
  })

  it('un `false` de la fiche est une décision, pas un « hérite » : il ne retombe pas sur le compte', () => {
    expect(resolvePreferences({ diceRolls: false }, { diceRolls: true }).diceRolls).toBe(false)
  })

  it('une fiche sans réglage suit le compte dès qu\'il change (héritage, pas copie)', () => {
    const sheet = null
    expect(resolvePreferences(sheet, { diceRolls: true }).diceRolls).toBe(true)
    expect(resolvePreferences(sheet, { diceRolls: false }).diceRolls).toBe(false)
  })

  it('chaque réglage canonique a un défaut booléen, un libellé et une description', () => {
    for (const key of PREFERENCE_KEYS) {
      expect(typeof PREFERENCES[key].default).toBe('boolean')
      expect(PREFERENCES[key].label).not.toBe('')
      expect(PREFERENCES[key].description).not.toBe('')
    }
  })
})

describe('preferencesSchema — dérivé de l\'ensemble canonique', () => {
  it('accepte un sous-ensemble de réglages, vide compris', () => {
    expect(preferencesSchema.parse({})).toEqual({})
    expect(preferencesSchema.parse({ diceRolls: false })).toEqual({ diceRolls: false })
  })

  it('refuse un réglage qui n\'est pas un booléen, et retire une clé inconnue', () => {
    expect(preferencesSchema.safeParse({ diceRolls: 'non' }).success).toBe(false)
    expect(preferencesSchema.parse({ diceRolls: true, inconnu: true })).toEqual({ diceRolls: true })
  })

  it('passe par le PUT de la fiche ; `null` rend la main au compte', () => {
    expect(updateCharacterSheetSchema.parse({ preferences: { diceRolls: false } }).preferences).toEqual({ diceRolls: false })
    expect(updateCharacterSheetSchema.parse({ preferences: null }).preferences).toBeNull()
    expect(updateCharacterSheetSchema.safeParse({ preferences: { diceRolls: 1 } }).success).toBe(false)
  })
})
