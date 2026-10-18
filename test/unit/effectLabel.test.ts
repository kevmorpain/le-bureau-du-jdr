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

  it('nomme les dés supplémentaires d\'un objet, mais pas ceux dont le nombre dépend du niveau', () => {
    const dice = (value: Extract<Effect, { type: 'weapon_damage_dice' }>['value']): Effect => ({ type: 'weapon_damage_dice', value })
    const flame = { name: 'Dégâts supplémentaires', dice: { op: 'fixed' as const, value: 2 }, sides: 6, damageType: 'fire' as const, weapons: 'all' as const, limit: 'each_hit' as const }
    expect(effectLabel(dice(flame))).toBe('+2d6 Feu')
    expect(labelledEffects([dice(flame)])).toEqual([{ label: '+2d6 Feu', malus: false }])
    expect(labelledEffects([dice({ ...flame, dice: { op: 'var', name: 'class_level' } })])).toEqual([])
  })

  it('une liste vide ou absente ne donne rien', () => {
    expect(labelledEffects([])).toEqual([])
    expect(labelledEffects(undefined)).toEqual([])
  })

  it('effectLabel garde le type brut en repli pour les autres appelants', () => {
    expect(effectLabel(unlabelled)).toBe('extra_attack')
  })
})
