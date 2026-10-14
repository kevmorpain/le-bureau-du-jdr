import { describe, it, expect } from 'vitest'
import { defaultKnSkills } from '../../shared/ker-nethalas/character'
import { KN_SKILL_IMPROVEMENT, knImproveMarkedSkills, knImproveSkill } from '../../shared/ker-nethalas/skillImprovement'

// Les tirages successifs voulus, dé après dé : `[100, 4]` donne un D100 de 100 puis un D4 de 4.
const rolls = (...results: [sides: number, result: number][]) => {
  const queue = [...results]
  return () => {
    const [sides, result] = queue.shift()!
    return (result - 0.5) / sides
  }
}

describe('amélioration de compétence', () => {
  it('au-dessus du score : +D4', () => {
    expect(knImproveSkill(40, rolls([100, 41], [4, 3]))).toEqual({ roll: 41, success: true, gain: 3, before: 40, after: 43 })
  })

  it('en dessous ou égal au score : +1, sans lancer de D4', () => {
    expect(knImproveSkill(40, rolls([100, 40]))).toEqual({ roll: 40, success: false, gain: 1, before: 40, after: 41 })
    expect(knImproveSkill(40, rolls([100, 1]))).toMatchObject({ success: false, after: 41 })
  })

  it('plafonné à 80, sans jamais baisser un score déjà au-delà', () => {
    expect(knImproveSkill(78, rolls([100, 99], [4, 4]))).toMatchObject({ gain: 2, after: KN_SKILL_IMPROVEMENT.max })
    expect(knImproveSkill(80, rolls([100, 99], [4, 4]))).toMatchObject({ gain: 0, after: 80 })
    expect(knImproveSkill(95, rolls([100, 10]))).toMatchObject({ gain: 0, after: 95 })
  })

  it('seules les compétences marquées sont testées, puis démarquées', () => {
    const skills = { ...defaultKnSkills(), stealth: { score: 30, marked: true }, dodge: { score: 50, marked: false } }
    const extra = [{ name: 'Chant', score: 20, marked: true }, { name: 'Danse', score: 20, marked: false }]

    const result = knImproveMarkedSkills(skills, extra, rolls([100, 90], [4, 2], [100, 5]))

    expect(result.skills.stealth).toEqual({ score: 32, marked: false })
    expect(result.skills.dodge).toEqual(skills.dodge)
    expect(result.extraSkills).toEqual([{ name: 'Chant', score: 21, marked: false }, extra[1]])
    expect(result.improvements.map(entry => entry.target)).toEqual([{ skill: 'stealth' }, { extra: 0 }])
  })

  it('rien à faire sans compétence marquée', () => {
    const skills = defaultKnSkills()

    const noRoll = () => {
      throw new Error('aucun tirage attendu')
    }

    expect(knImproveMarkedSkills(skills, [], noRoll)).toEqual({ skills, extraSkills: [], improvements: [] })
  })
})
