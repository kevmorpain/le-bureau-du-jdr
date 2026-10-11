import { describe, it, expect } from 'vitest'
import { knDiceLabel, knDiceSchema, knRollDice } from '../../shared/ker-nethalas/dice'
import { emptyKnStatus, knStatusSchema } from '../../shared/ker-nethalas/status'
import {
  knClearTemporary,
  knGainTemporary,
  knHealWounds,
  knRest,
  knResetUses,
  knSetTemporary,
  knTakeDamage,
  knTemporaryOf,
  type KnWoundsState,
} from '../../shared/ker-nethalas/vitals'
import { knApplyCriticalEffects } from '../../shared/ker-nethalas/roll'

const wounds = (over: Partial<KnWoundsState> = {}): KnWoundsState => ({
  toughness: 10, toughnessMax: 25, health: 12, healthMax: 15, temporaryToughness: 0, ...over,
})

describe('dégâts subis', () => {
  it('retirent la Robustesse, puis la Santé', () => {
    expect(knTakeDamage(wounds(), 4)).toMatchObject({ toughness: 6, health: 12 })
    expect(knTakeDamage(wounds(), 13)).toMatchObject({ toughness: 0, health: 9 })
    expect(knTakeDamage(wounds(), 99)).toMatchObject({ toughness: 0, health: 0 })
  })

  it('dépensent d\'abord la Robustesse temporaire, qui s\'épuise', () => {
    expect(knTakeDamage(wounds({ temporaryToughness: 5 }), 3)).toMatchObject({ temporaryToughness: 2, toughness: 10, health: 12 })
    expect(knTakeDamage(wounds({ temporaryToughness: 2 }), 5)).toMatchObject({ temporaryToughness: 0, toughness: 7, health: 12 })
    expect(knTakeDamage(wounds({ temporaryToughness: 5, toughness: 1 }), 9)).toMatchObject({ temporaryToughness: 0, toughness: 0, health: 9 })
  })

  it('un montant nul ou négatif ne change rien, et l\'état d\'origine n\'est pas modifié', () => {
    const original = wounds({ temporaryToughness: 2 })

    expect(knTakeDamage(original, 0)).toEqual(original)
    expect(knTakeDamage(original, -4)).toEqual(original)
    knTakeDamage(original, 7)
    expect(original).toEqual(wounds({ temporaryToughness: 2 }))
  })

  it('s\'appliquent aussi aux effets de critique, temporaire compris', () => {
    const state = { ...wounds({ temporaryToughness: 3 }), sanity: 10, sanityMax: 10, exhaustion: 0, exhaustionMax: 99 }
    const hit = knApplyCriticalEffects([{ type: 'damage', amount: 5, dice: 'D6 : 5' }], state)

    expect(hit).toMatchObject({ temporaryToughness: 0, toughness: 8, health: 12 })
    expect(knApplyCriticalEffects([{ type: 'damage', amount: 5, dice: 'D6 : 5' }], { ...state, temporaryToughness: undefined }).toughness).toBe(5)
  })
})

describe('soigner des Blessures', () => {
  it('remplit d\'abord la Robustesse, puis la Santé', () => {
    expect(knHealWounds(wounds(), 4)).toMatchObject({ toughness: 14, health: 12 })
    expect(knHealWounds(wounds(), 17)).toMatchObject({ toughness: 25, health: 14 })
    expect(knHealWounds(wounds(), 99)).toMatchObject({ toughness: 25, health: 15 })
  })

  it('ne ramène pas en arrière une jauge déjà au-dessus de son maximum', () => {
    expect(knHealWounds(wounds({ toughness: 30 }), 5)).toMatchObject({ toughness: 30, health: 15 })
  })

  it('ne touche pas à la Robustesse temporaire', () => {
    expect(knHealWounds(wounds({ temporaryToughness: 4 }), 3).temporaryToughness).toBe(4)
  })
})

describe('points temporaires', () => {
  it('s\'ajoutent, se règlent à la main dans les bornes, et s\'effacent', () => {
    let status = emptyKnStatus()
    expect(knTemporaryOf(status, 'toughness')).toBe(0)

    status = knGainTemporary(status, 'toughness', 3)
    status = knGainTemporary(status, 'toughness', 2)
    expect(knTemporaryOf(status, 'toughness')).toBe(5)
    expect(knTemporaryOf(status, 'sanity')).toBe(0)

    expect(knTemporaryOf(knSetTemporary(status, 'aether', -4), 'aether')).toBe(0)
    expect(knTemporaryOf(knSetTemporary(status, 'aether', 1e9), 'aether')).toBe(9999)
    expect(knStatusSchema.safeParse(status).success).toBe(true)

    expect(knClearTemporary(status)).not.toHaveProperty('temporary')
  })
})

describe('repos', () => {
  const used = [
    { key: 'alpha:1', limit: 'combat' as const },
    { key: 'alpha:2', limit: 'room' as const },
    { key: 'alpha:3', limit: 'rest' as const },
    { key: 'alpha:4', limit: 'campRest' as const },
  ]
  const status = knGainTemporary({ ...emptyKnStatus(), used }, 'toughness', 3)

  it('une pause efface le temporaire et les usages « par repos », pas ceux « par camp »', () => {
    const after = knRest(status, 'breather')

    expect(after).not.toHaveProperty('temporary')
    expect(after.used!.map(use => use.limit)).toEqual(['combat', 'room', 'campRest'])
  })

  it('un camp efface aussi les usages « par camp », mais pas ceux « par combat » ni « par pièce »', () => {
    expect(knRest(status, 'camp').used!.map(use => use.limit)).toEqual(['combat', 'room'])
  })

  it('remet à zéro une fréquence donnée, et laisse intact un survivant sans usage', () => {
    expect(knResetUses(status, ['combat']).used!.map(use => use.key)).toEqual(['alpha:2', 'alpha:3', 'alpha:4'])
    expect(knResetUses(emptyKnStatus(), ['rest'])).toEqual(emptyKnStatus())
    expect(knRest(emptyKnStatus(), 'camp')).toEqual(emptyKnStatus())
  })

  it('l\'état en cours accepte les usages et le temporaire, et refuse une fréquence inconnue', () => {
    expect(knStatusSchema.safeParse(status).success).toBe(true)
    expect(knStatusSchema.safeParse({ ...emptyKnStatus(), used: [{ key: 'alpha:1', limit: 'week' }] }).success).toBe(false)
    expect(knStatusSchema.safeParse({ ...emptyKnStatus(), temporary: { toughness: -1 } }).success).toBe(false)
  })
})

describe('dés', () => {
  const rng = (...values: number[]) => {
    let i = 0
    return () => values[i++ % values.length]!
  }

  it('jette autant de dés que demandé, plus le bonus, sans descendre sous zéro', () => {
    expect(knRollDice({ count: 2, sides: 6, bonus: 1 }, rng(0.5, 0.999))).toEqual({ rolls: [4, 6], total: 11 })
    expect(knRollDice({ count: 0, sides: 0, bonus: 5 })).toEqual({ rolls: [], total: 5 })
    expect(knRollDice({ count: 1, sides: 4, bonus: -9 }, rng(0)).total).toBe(0)
  })

  it('s\'écrit comme dans le livre', () => {
    expect(knDiceLabel({ count: 1, sides: 4, bonus: 0 })).toBe('D4')
    expect(knDiceLabel({ count: 3, sides: 6, bonus: 2 })).toBe('3D6+2')
    expect(knDiceLabel({ count: 1, sides: 4, bonus: 1 })).toBe('D4+1')
    expect(knDiceLabel({ count: 0, sides: 0, bonus: 5 })).toBe('5')
  })

  it('refuse un dé à une face ou moins, et accepte un montant fixe', () => {
    expect(knDiceSchema.safeParse({ count: 1, sides: 1, bonus: 0 }).success).toBe(false)
    expect(knDiceSchema.safeParse({ count: 0, sides: 0, bonus: 5 }).success).toBe(true)
    expect(knDiceSchema.safeParse({ count: 21, sides: 6, bonus: 0 }).success).toBe(false)
  })
})
