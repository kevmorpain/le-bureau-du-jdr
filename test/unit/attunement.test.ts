import { describe, it, expect } from 'vitest'
import { ATTUNEMENT_LIMIT, canAttune } from '../../shared/rules/attunement'

describe('harmonisation', () => {
  it('trois objets au plus', () => {
    expect(ATTUNEMENT_LIMIT).toBe(3)
    expect([0, 1, 2].map(canAttune)).toEqual([true, true, true])
    expect([3, 4].map(canAttune)).toEqual([false, false])
  })
})
