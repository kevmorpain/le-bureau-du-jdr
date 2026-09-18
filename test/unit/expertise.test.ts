import { describe, it, expect } from 'vitest'
import {
  EXPERTISE_COUNT_BY_CLASS,
  EXPERTISE_OWNER_NAME,
  expertiseProgression,
} from '../../server/db/seeds/data/expertise'
import { evaluate } from '../../shared/utils/formula'

describe('expertise — contrat des données', () => {
  it('tables cumulatives PHB 2014 : Roublard 2→4 (niv 1/6), Barde 2→4 (niv 3/10)', () => {
    expect(EXPERTISE_COUNT_BY_CLASS.Roublard).toEqual([2, 2, 2, 2, 2, 4])
    expect(EXPERTISE_COUNT_BY_CLASS.Barde).toEqual([0, 0, 2, 2, 2, 2, 2, 2, 2, 4])
  })

  it('le nom de l\'owner est « Expertise »', () => {
    expect(EXPERTISE_OWNER_NAME).toBe('Expertise')
  })

  it('la progression owner est bien formée (lookup, proficient_skills, non remplaçable)', () => {
    expect(expertiseProgression('Roublard')).toEqual({
      kind: 'expertise',
      count: { op: 'lookup', table: [2, 2, 2, 2, 2, 4] },
      optionSource: { type: 'proficient_skills' },
      replaceable: false,
    })
    expect(expertiseProgression('Barde')?.count).toEqual({ op: 'lookup', table: [0, 0, 2, 2, 2, 2, 2, 2, 2, 4] })
    expect(expertiseProgression('Guerrier')).toBeNull()
  })

  it('le count `lookup` rend bien le total CUMULATIF dû à chaque niveau (clamp au max)', () => {
    const at = (className: string, classLevel: number) =>
      evaluate(expertiseProgression(className)!.count, {
        level: classLevel, class_level: classLevel, prof_bonus: 0,
        str_mod: 0, dex_mod: 0, con_mod: 0, int_mod: 0, wis_mod: 0, cha_mod: 0,
      })
    expect(at('Roublard', 1)).toBe(2)
    expect(at('Roublard', 5)).toBe(2)
    expect(at('Roublard', 6)).toBe(4)
    expect(at('Roublard', 20)).toBe(4)
    expect(at('Barde', 2)).toBe(0)
    expect(at('Barde', 3)).toBe(2)
    expect(at('Barde', 9)).toBe(2)
    expect(at('Barde', 10)).toBe(4)
    expect(at('Barde', 20)).toBe(4)
  })
})
