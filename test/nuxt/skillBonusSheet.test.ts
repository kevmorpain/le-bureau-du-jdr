import { describe, it, expect } from 'vitest'
import type { Effect } from '../../server/db/schema/effects'
import { useDiceRoller } from '../../app/composables/useDiceRoller'
import { baseScores, mountSheet as mount } from './fixtures/mountSheet'

// Connaissance de la pierre (Nain) et Connaissance en ingénierie (Gnome des roches) : le double du bonus de maîtrise sur un
// test d'Histoire, si le joueur désigne la situation. Niveau 5 : bonus de maîtrise +3.

const FIGHTER = 3

const dwarf: Effect[] = [{ type: 'skill_bonus', value: { skill: 'history', bonusType: 'proficiency', multiplier: 2, condition: 'masonry_origins' } }]
const gnome: Effect[] = [{ type: 'skill_bonus', value: { skill: 'history', bonusType: 'proficiency', multiplier: 2, condition: 'magical_alchemical_technological_origins' } }]

const history = { type: 'check', ability: 'int', skill: 'history' } as const
const scenario = (speciesEffects: Effect[], skills: { skillKey: string, proficiencyLevel: 'proficient' | 'expert' }[] = []) =>
  ({ scores: baseScores(10, 10, 10, 10), classes: [{ classId: FIGHTER, level: 5 }], speciesEffects, skills })

describe('fiche — bonus de compétence conditionnel', () => {
  it('le Nain sans maîtrise d\'Histoire ajoute le double de son bonus de maîtrise', async () => {
    const s = await mount(scenario(dwarf))
    expect(s.rollEngine.policy(history, ['masonry_origins']).bonus).toMatchObject({ amount: 6 })
  })

  it('avec la maîtrise d\'Histoire, il n\'ajoute que ce qui manque', async () => {
    const s = await mount(scenario(dwarf, [{ skillKey: 'history', proficiencyLevel: 'proficient' }]))
    expect(s.rollEngine.policy(history, ['masonry_origins']).bonus).toMatchObject({ amount: 3 })
  })

  it('avec l\'expertise, rien n\'est ajouté', async () => {
    const s = await mount(scenario(dwarf, [{ skillKey: 'history', proficiencyLevel: 'expert' }]))
    expect(s.rollEngine.policy(history, ['masonry_origins']).bonus).toBeNull()
  })

  it('rien sans la situation désignée, ni pour une autre compétence', async () => {
    const s = await mount(scenario(dwarf))
    expect(s.rollEngine.policy(history, []).bonus).toBeNull()
    expect(s.rollEngine.policy({ type: 'check', ability: 'int', skill: 'arcana' }, ['masonry_origins']).bonus).toBeNull()
  })

  it('le Gnome des roches a sa propre situation', async () => {
    const s = await mount(scenario(gnome))
    expect(s.rollEngine.policy(history, ['masonry_origins']).bonus).toBeNull()
    expect(s.rollEngine.policy(history, ['magical_alchemical_technological_origins']).bonus).toMatchObject({ amount: 6 })
  })

  it('le jet lancé applique le bonus, le note, et vide la situation', async () => {
    const s = await mount(scenario(dwarf))
    s.rollEngine.pending.value = { ...s.rollEngine.pending.value, situations: ['masonry_origins'] }
    const { roll, toasts } = useDiceRoller(s.rollEngine)
    roll('Histoire', 1, 20, 1, { d20: history })
    const entry = toasts.value.at(-1)!
    expect(entry.modifier).toBe(7)
    expect(entry.result).toBe(entry.natural + 7)
    expect(entry.bonus).toMatchObject({ amount: 6 })
    expect(entry.replay.modifier).toBe(1)
    expect(s.rollEngine.pending.value.situations).toEqual([])
  })

  it('propose la situation dans le lanceur de dés', async () => {
    const s = await mount(scenario(dwarf))
    expect(s.rollEngine.situations.value).toEqual(['masonry_origins'])
  })
})
