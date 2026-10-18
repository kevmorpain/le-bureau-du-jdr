import { describe, it, expect } from 'vitest'
import { NO_RANGE_CHOICE, rangeRollSources } from '../../shared/rules/weaponRange'

describe('portée d\'une attaque à distance', () => {
  it('sans choix du joueur, aucun désavantage', () => {
    expect(rangeRollSources(NO_RANGE_CHOICE)).toEqual([])
  })

  it('longue portée : désavantage', () => {
    expect(rangeRollSources({ long: true, adjacent: false })).toEqual([{ label: 'Longue portée', mode: 'disadvantage' }])
  })

  it('ennemi à 1,50 m : désavantage', () => {
    expect(rangeRollSources({ long: false, adjacent: true })).toEqual([{ label: 'Ennemi à 1,50 m', mode: 'disadvantage' }])
  })

  it('les deux sources sont nommées ; le moteur de jets en tire un seul désavantage', () => {
    expect(rangeRollSources({ long: true, adjacent: true }).map(s => s.label)).toEqual(['Longue portée', 'Ennemi à 1,50 m'])
  })
})
