import { describe, expect, it } from 'vitest'
import { emptyKnMadness, knReduceXpGain, knSanityLossExtra } from '../../shared/ker-nethalas/catalog/madness'
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

  it('« Les ténèbres approchent » ajoute son cumul à une vraie perte de Santé mentale seulement', () => {
    const madness = { ...emptyKnMadness(), counters: { ...emptyKnMadness().counters, darknessComing: 2 } }
    expect(knSanityLossExtra(madness, 3)).toBe(2)
    expect(knSanityLossExtra(madness, 0)).toBe(0)
    expect(knSanityLossExtra(emptyKnMadness(), 3)).toBe(0)
  })

  it('« Mémoire défaillante » retire 10 XP par cumul à un gain, sans descendre sous 0', () => {
    const madness = { ...emptyKnMadness(), counters: { ...emptyKnMadness().counters, forgetfulness: 2 } }
    expect(knReduceXpGain(100, madness)).toBe(80)
    expect(knReduceXpGain(15, madness)).toBe(0)
    expect(knReduceXpGain(100, emptyKnMadness())).toBe(100)
  })

  it('un résultat ramené à 1 ou moins compte comme un 1', () => {
    const madness = { ...emptyKnMadness(), counters: { ...emptyKnMadness().counters, fragileMind: 3 } }
    expect(knDrawMadness(madness, 3).outcome).toEqual({ kind: 'death' })
  })
})
