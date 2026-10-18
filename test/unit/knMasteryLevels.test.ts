import { describe, expect, it } from 'vitest'
import { knLockMastery, knUnlockMastery, type KnMastery } from '../../shared/ker-nethalas/masteries'
import { knMasteryLevelSources } from '../../shared/ker-nethalas/masteryEffects'
import { fakeMastery } from '../fixtures/knMasteries'

const growing = (): KnMastery => {
  const base = fakeMastery('alpha')
  return {
    ...base,
    abilities: base.abilities.map(ability => ability.tier === 4
      ? { ...ability, permanent: { maxVitalPerLevel: { vital: 'toughness' as const, atUnlock: 1, perLevel: 2 } } }
      : ability) as KnMastery['abilities'],
  }
}

describe('niveau auquel un palier est débloqué', () => {
  it('se retient au déblocage et s\'oublie au retrait du palier', () => {
    const first = knUnlockMastery([], 'alpha', 3)
    expect(first).toEqual([{ key: 'alpha', tiers: 1, levels: { 1: 3 } }])

    const second = knUnlockMastery(first, 'alpha', 5)
    expect(second).toEqual([{ key: 'alpha', tiers: 2, levels: { 1: 3, 2: 5 } }])

    expect(knLockMastery(second, 'alpha')).toEqual([{ key: 'alpha', tiers: 1, levels: { 1: 3 } }])
    expect(knLockMastery(knLockMastery(second, 'alpha'), 'alpha')).toEqual([])
  })
})

describe('maximum d\'une jauge qui grandit avec le niveau', () => {
  const amount = (level: number, picks: Parameters<typeof knMasteryLevelSources>[1]) =>
    knMasteryLevelSources([growing()], picks, level)[0]?.effects[0]

  it('vaut le niveau d\'obtention, plus 2 par niveau gagné depuis', () => {
    const picks = [{ key: 'alpha', tiers: 4, levels: { 4: 6 } }]

    expect(amount(6, picks)).toEqual({ type: 'maxVitalDelta', vital: 'toughness', amount: 6 })
    expect(amount(9, picks)).toEqual({ type: 'maxVitalDelta', vital: 'toughness', amount: 12 })
  })

  it('sans niveau d\'obtention connu, l\'aptitude compte comme obtenue au niveau actuel', () => {
    expect(amount(8, [{ key: 'alpha', tiers: 4 }])).toEqual({ type: 'maxVitalDelta', vital: 'toughness', amount: 8 })
  })

  it('rien tant que le palier n\'est pas débloqué', () => {
    expect(knMasteryLevelSources([growing()], [{ key: 'alpha', tiers: 3 }], 8)).toEqual([])
    expect(knMasteryLevelSources([growing()], [], 8)).toEqual([])
  })
})
