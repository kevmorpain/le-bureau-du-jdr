import { describe, it, expect } from 'vitest'
import type { Effect } from '../../server/db/schema/effects'
import { effectLabel, labelledEffects } from '../../app/utils/effectLabel'

const resistance = { type: 'damage_resistance', value: { damageType: 'fire' } } as Effect
const malus = { type: 'initiative_bonus', value: { amount: -2 } } as Effect
const unlabelled = { type: 'extra_attack', value: { attacks: { op: 'fixed', value: 2 } } } as Effect

describe('labelledEffects', () => {
  it('ne garde que les effets que la fiche sait nommer, et marque les malus', () => {
    expect(labelledEffects([resistance, unlabelled, malus])).toEqual([
      { label: 'Résistance Feu', malus: false },
      { label: '-2 initiative', malus: true },
    ])
  })

  it('une liste vide ou absente ne donne rien', () => {
    expect(labelledEffects([])).toEqual([])
    expect(labelledEffects(undefined)).toEqual([])
  })

  it('effectLabel garde le type brut en repli pour les autres appelants', () => {
    expect(effectLabel(unlabelled)).toBe('extra_attack')
  })
})
