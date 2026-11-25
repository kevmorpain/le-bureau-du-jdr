import { describe, it, expect } from 'vitest'
import { adjustDamageLine, applyDamageSources, sourceDamage, type HitPointState } from '../../shared/rules/damage'

// Résistance puis vulnérabilité après tout autre modificateur, sans cumul ; un jet de concentration et un échec
// aux jets contre la mort par source de dégâts.

const state = (over: Partial<HitPointState> = {}): HitPointState =>
  ({ currentHp: 20, temporaryHp: 0, deathSaveSuccesses: 0, deathSaveFailures: 0, ...over })

describe('adjustDamageLine', () => {
  it('résistance : moitié arrondie à l’inférieur ; vulnérabilité : double ; immunité : zéro', () => {
    expect(adjustDamageLine({ amount: 7, defense: 'resistance' })).toBe(3)
    expect(adjustDamageLine({ amount: 7, defense: 'vulnerability' })).toBe(14)
    expect(adjustDamageLine({ amount: 7, defense: 'immunity' })).toBe(0)
    expect(adjustDamageLine({ amount: 7, defense: null })).toBe(7)
  })

  it('l’Esquive instinctive divise avant la résistance', () => {
    expect(adjustDamageLine({ amount: 9, defense: 'resistance' }, { halved: true })).toBe(2)
  })
})

describe('sourceDamage', () => {
  it('additionne les types d’un même coup, chacun avec sa défense', () => {
    expect(sourceDamage([{ amount: 9, defense: null }, { amount: 7, defense: 'resistance' }])).toBe(12)
  })
})

describe('applyDamageSources', () => {
  it('applique les sources l’une après l’autre, PV temporaires d’abord', () => {
    const result = applyDamageSources(state({ temporaryHp: 5 }), [4, 6], { maxHp: 20 })
    expect(result.state).toMatchObject({ currentHp: 15, temporaryHp: 0 })
    expect(result.sources.map(s => s.absorbedByTemporary)).toEqual([4, 1])
    expect(result.absorbedByTemporary).toBe(5)
  })

  it('à 0 PV, chaque source compte son échec aux jets contre la mort', () => {
    const result = applyDamageSources(state({ currentHp: 0 }), [3, 2], { maxHp: 20 })
    expect(result.state.deathSaveFailures).toBe(2)
    expect(result.deathSaveFailuresAdded).toBe(2)
  })

  it('une source qui fait tomber à 0 PV, puis une autre : un échec', () => {
    const result = applyDamageSources(state({ currentHp: 5 }), [5, 1], { maxHp: 20 })
    expect(result.droppedToZero).toBe(true)
    expect(result.state).toMatchObject({ currentHp: 0, deathSaveFailures: 1 })
  })

  it('s’arrête à la mort', () => {
    const result = applyDamageSources(state({ currentHp: 2 }), [30, 4], { maxHp: 20 })
    expect(result.instantDeath).toBe(true)
    expect(result.sources).toHaveLength(1)
  })
})
