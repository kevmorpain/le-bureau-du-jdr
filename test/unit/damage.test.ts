import { describe, it, expect } from 'vitest'
import {
  applyDamage,
  applyHealing,
  concentrationSaveDc,
  gainTemporaryHp,
  isDead,
  isStable,
  rollDeathSave,
  type HitPointState,
} from '../../shared/rules/damage'

// Valeurs vérifiées contre AideDD, Combat : mort instantanée si les dégâts restants à 0 PV atteignent le maximum
// (clerc de 12 PV max à 6 PV qui subit 18 dégâts : il meurt) ; à 0 PV, des dégâts comptent un échec (deux sur un
// critique) ; 20 naturel : 1 PV ; 1 naturel : deux échecs ; les soins ne redonnent pas de PV temporaires.

const state = (over: Partial<HitPointState> = {}): HitPointState =>
  ({ currentHp: 20, temporaryHp: 0, deathSaveSuccesses: 0, deathSaveFailures: 0, ...over })

describe('applyDamage — au-dessus de 0 PV', () => {
  it('retire les dégâts aux PV', () => {
    const r = applyDamage(state(), 7, { maxHp: 30 })
    expect(r.state.currentHp).toBe(13)
    expect(r.droppedToZero).toBe(false)
  })

  it('les PV temporaires absorbent d\'abord', () => {
    const r = applyDamage(state({ temporaryHp: 5 }), 8, { maxHp: 30 })
    expect(r.state).toMatchObject({ temporaryHp: 0, currentHp: 17 })
    expect(r.absorbedByTemporary).toBe(5)
  })

  it('des dégâts entièrement absorbés ne touchent pas aux PV', () => {
    const r = applyDamage(state({ temporaryHp: 9 }), 4, { maxHp: 30 })
    expect(r.state).toMatchObject({ temporaryHp: 5, currentHp: 20 })
  })

  it('tombe à 0 PV sans mourir tant que le reste est sous le maximum', () => {
    const r = applyDamage(state({ currentHp: 6 }), 10, { maxHp: 12 })
    expect(r.state).toMatchObject({ currentHp: 0, deathSaveFailures: 0 })
    expect(r.droppedToZero).toBe(true)
    expect(r.instantDeath).toBe(false)
  })

  it('mort instantanée : clerc de 12 PV max à 6 PV qui subit 18 dégâts', () => {
    const r = applyDamage(state({ currentHp: 6 }), 18, { maxHp: 12 })
    expect(r.instantDeath).toBe(true)
    expect(isDead(r.state)).toBe(true)
    expect(r.state.currentHp).toBe(0)
  })

  it('un reste juste sous le maximum ne tue pas (17 dégâts : 11 < 12)', () => {
    expect(applyDamage(state({ currentHp: 6 }), 17, { maxHp: 12 }).instantDeath).toBe(false)
  })

  it('le reste se compte après les PV temporaires', () => {
    // 18 dégâts − 6 temporaires = 12 sur 6 PV : reste 6 < 12.
    expect(applyDamage(state({ currentHp: 6, temporaryHp: 6 }), 18, { maxHp: 12 }).instantDeath).toBe(false)
  })
})

describe('applyDamage — à 0 PV', () => {
  const dying = (over: Partial<HitPointState> = {}) => state({ currentHp: 0, ...over })

  it('un échec aux jets contre la mort', () => {
    const r = applyDamage(dying(), 3, { maxHp: 30 })
    expect(r.state.deathSaveFailures).toBe(1)
    expect(r.deathSaveFailuresAdded).toBe(1)
  })

  it('deux échecs sur un coup critique', () => {
    expect(applyDamage(dying(), 3, { maxHp: 30, critical: true }).state.deathSaveFailures).toBe(2)
  })

  it('la mort au troisième échec', () => {
    const r = applyDamage(dying({ deathSaveFailures: 2 }), 3, { maxHp: 30, critical: true })
    expect(r.state.deathSaveFailures).toBe(3)
    expect(isDead(r.state)).toBe(true)
    expect(r.deathSaveFailuresAdded).toBe(1)
  })

  it('mort instantanée quand les dégâts atteignent le maximum de PV', () => {
    const r = applyDamage(dying(), 30, { maxHp: 30 })
    expect(r.instantDeath).toBe(true)
    expect(isDead(r.state)).toBe(true)
  })

  it('des dégâts à un personnage stable le rendent de nouveau mourant', () => {
    const stable = dying({ deathSaveSuccesses: 3 })
    expect(isStable(stable)).toBe(true)
    const r = applyDamage(stable, 2, { maxHp: 30 })
    expect(isStable(r.state)).toBe(false)
    expect(r.state).toMatchObject({ deathSaveSuccesses: 0, deathSaveFailures: 1 })
  })

  it('les PV temporaires absorbent aussi à 0 PV', () => {
    const r = applyDamage(dying({ temporaryHp: 5 }), 3, { maxHp: 30 })
    expect(r.state).toMatchObject({ temporaryHp: 2, deathSaveFailures: 0 })
  })

  it('aucun dégât, aucun changement', () => {
    expect(applyDamage(dying(), 0, { maxHp: 30 }).state).toEqual(dying())
  })
})

describe('applyHealing', () => {
  it('rend des PV jusqu\'au maximum et remet les jets contre la mort à zéro', () => {
    const r = applyHealing(state({ currentHp: 0, deathSaveSuccesses: 2, deathSaveFailures: 2 }), 50, { maxHp: 30 })
    expect(r).toMatchObject({ currentHp: 30, deathSaveSuccesses: 0, deathSaveFailures: 0 })
  })

  it('un soin nul ne change rien', () => {
    expect(applyHealing(state({ deathSaveFailures: 1 }), 0, { maxHp: 30 }).deathSaveFailures).toBe(1)
  })
})

describe('gainTemporaryHp', () => {
  it('garde le plus grand des deux lots, sans cumul, et ne soigne pas', () => {
    expect(gainTemporaryHp(state({ temporaryHp: 8 }), 5).temporaryHp).toBe(8)
    expect(gainTemporaryHp(state({ temporaryHp: 3 }), 5).temporaryHp).toBe(5)
    expect(gainTemporaryHp(state({ currentHp: 0, deathSaveFailures: 1 }), 5)).toMatchObject({ currentHp: 0, deathSaveFailures: 1 })
  })
})

describe('rollDeathSave', () => {
  const dying = state({ currentHp: 0, deathSaveSuccesses: 1, deathSaveFailures: 1 })

  it('20 naturel : 1 PV et les jets repartent de zéro', () => {
    const r = rollDeathSave(dying, 20)
    expect(r.outcome).toBe('recovered')
    expect(r.state).toMatchObject({ currentHp: 1, deathSaveSuccesses: 0, deathSaveFailures: 0 })
  })

  it('1 naturel : deux échecs', () => {
    expect(rollDeathSave(dying, 1)).toMatchObject({ outcome: 'two-failures', state: { deathSaveFailures: 3 } })
  })

  it('10 ou plus : un succès ; 9 ou moins : un échec', () => {
    expect(rollDeathSave(dying, 10)).toMatchObject({ outcome: 'success', state: { deathSaveSuccesses: 2 } })
    expect(rollDeathSave(dying, 9)).toMatchObject({ outcome: 'failure', state: { deathSaveFailures: 2 } })
  })

  it('trois succès : stable', () => {
    const r = rollDeathSave({ ...dying, deathSaveSuccesses: 2 }, 15)
    expect(isStable(r.state)).toBe(true)
  })
})

describe('concentrationSaveDc', () => {
  it('10 ou la moitié des dégâts, le plus grand', () => {
    expect(concentrationSaveDc(7)).toBe(10)
    expect(concentrationSaveDc(20)).toBe(10)
    expect(concentrationSaveDc(25)).toBe(12)
    expect(concentrationSaveDc(41)).toBe(20)
  })
})
