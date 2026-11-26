import { describe, it, expect } from 'vitest'
import { diceBounds } from '../../shared/rules/dice'

describe('diceBounds', () => {
  it('du plus petit au plus grand résultat, modificateur compris', () => {
    expect(diceBounds('1d3')).toEqual({ min: 1, max: 3 })
    expect(diceBounds('1d6+4')).toEqual({ min: 5, max: 10 })
    expect(diceBounds('2d4-1')).toEqual({ min: 1, max: 7 })
  })

  it('une expression illisible n’a pas de bornes', () => {
    expect(diceBounds('d20')).toBeNull()
  })
})
