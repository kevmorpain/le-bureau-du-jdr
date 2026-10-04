import { describe, it, expect } from 'vitest'
import type { DiceRoll } from '../../app/composables/useDiceRoller'
import { rollDiceText, rollNotes, rollText } from '../../app/utils/rollSummary'

const roll = (over: Partial<DiceRoll>): DiceRoll => ({
  id: 1,
  at: 0,
  label: 'Attaque — Épée longue',
  rolls: [12],
  keptIndex: 0,
  natural: 12,
  modifier: 5,
  result: 17,
  isCrit: false,
  isFumble: false,
  replay: { label: 'Attaque — Épée longue', modifier: 5, sides: 20, count: 1, options: {} },
  ...over,
})

describe('rollDiceText', () => {
  it('un d20 : le dé et le modificateur', () => {
    expect(rollDiceText(roll({}))).toBe('12 +5')
    expect(rollDiceText(roll({ modifier: -1 }))).toBe('12 -1')
    expect(rollDiceText(roll({ modifier: 0 }))).toBe('12')
  })

  it('avantage ou désavantage : le dé écarté entre parenthèses', () => {
    expect(rollDiceText(roll({ rolls: [4, 17], keptIndex: 1 }))).toBe('(4) 17 +5')
    expect(rollDiceText(roll({ rolls: [17, 4], keptIndex: 1 }))).toBe('(17) 4 +5')
  })

  it('une somme de dés : les dés additionnés', () => {
    expect(rollDiceText(roll({ rolls: [2, 3], keptIndex: undefined, natural: 5, modifier: 3 }))).toBe('2+3 +3')
  })
})

describe('rollNotes', () => {
  it('nomme les sources de l\'avantage ou du désavantage', () => {
    expect(rollNotes(roll({ mode: 'advantage', advantage: ['Rage'] }))).toEqual(['Avantage (Rage)'])
    expect(rollNotes(roll({ mode: 'disadvantage', disadvantage: ['Empoisonné', 'Épuisement niv. 1+'] }))).toEqual(['Désavantage (Empoisonné, Épuisement niv. 1+)'])
  })

  it('dit quand un avantage et un désavantage s\'annulent', () => {
    expect(rollNotes(roll({ mode: 'normal', advantage: ['Rage'], disadvantage: ['Empoisonné'] }))).toEqual(['Avantage et désavantage s\'annulent'])
    expect(rollNotes(roll({ mode: 'normal', advantage: [], disadvantage: [] }))).toEqual([])
  })

  it('relance, plancher, échec automatique et critique de dégâts', () => {
    expect(rollNotes(roll({ rerolled: { from: 1, to: 14 } }))).toEqual(['Relance : 1 → 14'])
    expect(rollNotes(roll({ floored: 4, natural: 10 }))).toEqual(['4 compte pour 10'])
    expect(rollNotes(roll({ autoFail: ['Étourdi'] }))).toEqual(['Échec automatique (Étourdi)'])
    expect(rollNotes(roll({ critDamage: true }))).toEqual(['Coup critique : dés doublés'])
  })
})

describe('rollText', () => {
  it('une ligne copiable : libellé, résultat, dés et remarques', () => {
    expect(rollText(roll({ rolls: [4, 17], keptIndex: 1, natural: 17, result: 22, mode: 'advantage', advantage: ['Choix du joueur'] })))
      .toBe('Attaque — Épée longue : 22 ((4) 17 +5) — Avantage (Choix du joueur)')
  })
})
