import { describe, it, expect } from 'vitest'
import { KN_XP, knObstacleXp } from '../../shared/ker-nethalas/experience'
import type { KnObstacle } from '../../shared/ker-nethalas/run'

const door = (over: Partial<KnObstacle> = {}): KnObstacle => ({ kind: 'door', ...over })

describe('expérience du livre', () => {
  it('les valeurs de la p. 63', () => {
    expect(KN_XP).toEqual({ combat: 50, overseer: 200, lockOpened: 10, trapDisarmed: 10, newDomain: 50, loreBook: 10 })
  })

  it('un verrou qui s\'ouvre rapporte 10 XP, une seule fois', () => {
    const opened = door({ lockOpen: true })

    expect(knObstacleXp(door(), opened)).toEqual([{ source: 'lockOpened', amount: 10 }])
    expect(knObstacleXp(opened, opened)).toEqual([])
    expect(knObstacleXp(door(), door({ forced: 1 }))).toEqual([])
  })

  it('un piège désamorcé rapporte 10 XP ; contourné, évité ou subi, rien', () => {
    expect(knObstacleXp(door(), door({ trapState: 'disarmed' }))).toEqual([{ source: 'trapDisarmed', amount: 10 }])
    expect(knObstacleXp(door({ trapState: 'disarmed' }), door({ trapState: 'disarmed' }))).toEqual([])
    for (const trapState of ['bypassed', 'avoided', 'suffered', 'triggering'] as const) {
      expect(knObstacleXp(door(), door({ trapState }))).toEqual([])
    }
  })

  it('un piège désamorcé et un verrou ouvert dans le même acte comptent chacun', () => {
    expect(knObstacleXp(door(), door({ lockOpen: true, trapState: 'disarmed' }))).toHaveLength(2)
    expect(knObstacleXp(undefined, door({ lockOpen: true }))).toEqual([])
  })
})
