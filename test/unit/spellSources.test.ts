import { describe, it, expect } from 'vitest'
import { spellSourceLabel, spellSourceTooltip } from '../../app/utils/spellSources'
import { spellCostTagOf } from '../../shared/rules/actionCost'

describe('libellés des sources de sort', () => {
  it('nomme chaque source, et les Arcanum avec leur niveau', () => {
    expect(spellSourceLabel('pact_tome')).toBe('Pacte · Tome')
    expect(spellSourceLabel('feat')).toBe('Don')
    expect(spellSourceLabel('arcanum_7')).toBe('Arcanum (niv. 7) — 1/repos long')
    expect(spellSourceTooltip('arcanum_7')).toContain('niv. 7')
    expect(spellSourceLabel(null)).toBe('')
    expect(spellSourceLabel('inconnue')).toBe('')
  })
})

describe('étiquette de coût d\'un sort', () => {
  it('rend A, B ou R, et rien pour une incantation plus longue', () => {
    expect(spellCostTagOf('1 action')).toBe('action')
    expect(spellCostTagOf('1 action bonus')).toBe('bonus')
    expect(spellCostTagOf('1 réaction, que vous prenez…')).toBe('reaction')
    expect(spellCostTagOf('1 minute')).toBeNull()
  })
})
