import { describe, it, expect } from 'vitest'
import type { Effect } from '../../server/db/schema/effects'
import { SIGHT_MODIFIER_LABELS, darkvisionRange, sensesOf } from '../../shared/rules/senses'
import { warlockInvocations } from '../../server/db/seeds/data/warlock_invocations'

const darkvision = (range: number): Effect => ({ type: 'darkvision', value: { range } })
const sight = (kind: keyof typeof SIGHT_MODIFIER_LABELS): Effect => ({ type: 'sight_modifier', value: { kind } })

describe('sens', () => {
  it('retient la plus longue vision dans le noir', () => {
    expect(darkvisionRange([darkvision(18), darkvision(36)])).toBe(36)
    expect(darkvisionRange([])).toBe(0)
  })

  it('liste la vision dans le noir, puis chaque sens des manifestations une seule fois', () => {
    expect(sensesOf([darkvision(18), sight('read_all_writing'), sight('read_all_writing'), sight('magical_darkness_120')])).toEqual([
      'Vision dans le noir 18 m',
      SIGHT_MODIFIER_LABELS.read_all_writing,
      SIGHT_MODIFIER_LABELS.magical_darkness_120,
    ])
  })

  it('ne liste rien sans effet de vue', () => {
    expect(sensesOf([{ type: 'walking_speed', value: 9 }])).toEqual([])
  })

  it('chaque effet de vue des manifestations seedées a son libellé', () => {
    const kinds = warlockInvocations.flatMap(i => i.effects.flatMap(e => (e.type === 'sight_modifier' ? [e.value.kind] : [])))
    expect(kinds.length).toBeGreaterThan(0)
    for (const kind of kinds) expect(SIGHT_MODIFIER_LABELS[kind], kind).toBeTruthy()
  })
})
