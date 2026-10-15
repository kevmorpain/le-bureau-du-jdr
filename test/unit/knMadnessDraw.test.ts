import { describe, expect, it } from 'vitest'
import { emptyKnMadness } from '../../shared/ker-nethalas/catalog/madness'
import { knDrawMadness, knMadnessOutcome } from '../../shared/ker-nethalas/madnessDraw'

describe('table de Folie (D10)', () => {
  it('lit chaque résultat', () => {
    expect(knMadnessOutcome(1)).toEqual({ kind: 'death' })
    expect(knMadnessOutcome(2)).toEqual({ kind: 'counter', key: 'fragileMind' })
    expect(knMadnessOutcome(3)).toEqual({ kind: 'counter', key: 'physicalReactions' })
    expect(knMadnessOutcome(4)).toEqual({ kind: 'counter', key: 'darknessComing' })
    expect(knMadnessOutcome(5)).toEqual({ kind: 'counter', key: 'rushing' })
    expect(knMadnessOutcome(6)).toEqual({ kind: 'counter', key: 'darkResistance' })
    expect(knMadnessOutcome(7)).toEqual({ kind: 'counter', key: 'forgetfulness' })
    expect(knMadnessOutcome(8)).toEqual({ kind: 'lostSkill' })
    expect(knMadnessOutcome(9)).toEqual({ kind: 'damage' })
    expect(knMadnessOutcome(10)).toEqual({ kind: 'xp' })
  })

  it('un résultat cumulatif ajoute un cumul et laisse l\'original intact', () => {
    const madness = emptyKnMadness()
    const drawn = knDrawMadness(madness, 5)
    expect(drawn.madness.counters.rushing).toBe(1)
    expect(madness.counters.rushing).toBe(0)
    expect(knDrawMadness(drawn.madness, 5).madness.counters.rushing).toBe(2)
  })

  it('le résultat 8 ajoute un souvenir bloqué à choisir', () => {
    expect(knDrawMadness(emptyKnMadness(), 8).madness.lostSkills).toEqual([{}])
  })

  it('la mort, les dégâts et l\'XP ne changent pas la fiche de Folie', () => {
    for (const roll of [1, 9, 10]) expect(knDrawMadness(emptyKnMadness(), roll).madness).toEqual(emptyKnMadness())
  })

  it('« Esprit fragile » retire 1 par cumul au D10', () => {
    const madness = { ...emptyKnMadness(), counters: { ...emptyKnMadness().counters, fragileMind: 2 } }
    const drawn = knDrawMadness(madness, 5)
    expect(drawn.modified).toBe(3)
    expect(drawn.outcome).toEqual({ kind: 'counter', key: 'physicalReactions' })
  })

  it('un résultat ramené à 1 ou moins compte comme un 1', () => {
    const madness = { ...emptyKnMadness(), counters: { ...emptyKnMadness().counters, fragileMind: 3 } }
    expect(knDrawMadness(madness, 3).outcome).toEqual({ kind: 'death' })
  })
})
