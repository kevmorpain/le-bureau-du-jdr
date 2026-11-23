import { describe, it, expect } from 'vitest'
import { featureCostOf, spellCostOf } from '../../shared/rules/actionCost'
import { spells } from '../../server/db/seeds/data/spells'

describe('spellCostOf', () => {
  it.each([
    ['1 action', 'action'],
    ['1 action bonus', 'bonus'],
    ['1 réaction', 'reaction'],
    ['1 action ou 8 heures', 'action'],
    ['1 minute', 'other'],
    ['10 minutes', 'other'],
    ['1 heure', 'other'],
  ] as const)('« %s » → %s', (castingTime, cost) => {
    expect(spellCostOf(castingTime)).toBe(cost)
  })

  it('une réaction n\'est pas prise pour une action, bien que « réaction » contienne « action »', () => {
    expect(spellCostOf('1 réaction, que vous prenez quand vous êtes touché')).toBe('reaction')
  })

  it('chaque sort seedé qui commence par « 1 action bonus » ou « 1 réaction » quitte le groupe Action', () => {
    const bonus = spells.filter(spell => spell.castingTime.startsWith('1 action bonus'))
    const reactions = spells.filter(spell => spell.castingTime.startsWith('1 réaction'))
    expect(bonus.length).toBeGreaterThan(0)
    expect(reactions.length).toBeGreaterThan(0)
    expect(bonus.every(spell => spellCostOf(spell.castingTime) === 'bonus')).toBe(true)
    expect(reactions.every(spell => spellCostOf(spell.castingTime) === 'reaction')).toBe(true)
  })
})

describe('featureCostOf', () => {
  it('traduit le type d\'action d\'une capacité ; libre ou absent → autre', () => {
    expect(featureCostOf('action')).toBe('action')
    expect(featureCostOf('bonus_action')).toBe('bonus')
    expect(featureCostOf('reaction')).toBe('reaction')
    expect(featureCostOf('free')).toBe('other')
    expect(featureCostOf(null)).toBe('other')
  })
})
