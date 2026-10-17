import { describe, expect, it } from 'vitest'
import { knCreatureBuffSchema } from '../../shared/ker-nethalas/combatState'
import { knMonsterFumble, knSurvivorFumble } from '../../shared/ker-nethalas/fumbles'
import {
  emptyKnRun,
  knAddCreatureBuff,
  knBleedCreature,
  knConsumeLostTurn,
  knNextCombatRound,
  knSetDefenseAdvantage,
  knNewDomain,
  knSetImmuneConditions,
  knSetTensionStart,
  knStartCombat,
  knTensionCheck,
  knTensionStart,
} from '../../shared/ker-nethalas/run'

const d = (count: number, sides: number, bonus = 0) => ({ count, sides, bonus })
const fight = () => knStartCombat(emptyKnRun(), [{ name: 'A', health: 5, maxHealth: 5 }, { name: 'B', health: 5, maxHealth: 5 }])

describe('maladresses du survivant', () => {
  it('chaque résultat du D10 est lu', () => {
    expect(knSurvivorFumble(1)).toEqual({ kind: 'weaponLost' })
    expect(knSurvivorFumble(2)).toEqual({ kind: 'weaponLost' })
    expect(knSurvivorFumble(3)).toEqual({ kind: 'weaponBreaks' })
    expect(knSurvivorFumble(4)).toEqual({ kind: 'beltBreaks' })
    expect(knSurvivorFumble(5)).toEqual({ kind: 'aetherLoss', dice: d(1, 8) })
    expect(knSurvivorFumble(6)).toEqual({ kind: 'conditions', list: [{ key: 'prone' }] })
    expect(knSurvivorFumble(7)).toEqual({ kind: 'conditions', list: [{ key: 'prone' }, { key: 'dazed', value: 2 }] })
    expect(knSurvivorFumble(8)).toEqual({ kind: 'selfHit', critical: false, ally: true })
    expect(knSurvivorFumble(9)).toEqual({ kind: 'selfHit', critical: false, ally: false })
    expect(knSurvivorFumble(10)).toEqual({ kind: 'selfHit', critical: true, ally: false })
  })
})

describe('maladresses des créatures', () => {
  it('chaque résultat du D10 est lu : effet sur la créature, sur le survivant ou dégâts qu\'elle s\'inflige', () => {
    expect(knMonsterFumble(1)).toMatchObject({ kind: 'creatureBuff', buff: { combatSkill: -20, once: true } })
    expect(knMonsterFumble(2)).toMatchObject({ kind: 'creatureBuff', buff: { lostTurn: 1, noDefense: true } })
    expect(knMonsterFumble(3)).toMatchObject({ kind: 'creatureBuff', buff: { combatSkill: -20 }, rounds: d(1, 4) })
    expect(knMonsterFumble(4)).toEqual({ kind: 'survivorDefenseAdvantage', rounds: 2 })
    expect(knMonsterFumble(5)).toEqual({ kind: 'survivorCondition', key: 'concealed', rounds: d(1, 4) })
    expect(knMonsterFumble(6)).toMatchObject({ kind: 'creatureBuff', buff: { lostTurn: 1, advantageAgainst: true } })
    expect(knMonsterFumble(7)).toMatchObject({ kind: 'creatureBuff', buff: { lostTurn: 2, noDefense: true, advantageAgainst: true } })
    expect(knMonsterFumble(8)).toMatchObject({ kind: 'creatureBuff', buff: { combatSkill: -20, defenseSkill: 20, rounds: 2 } })
    expect(knMonsterFumble(9)).toEqual({ kind: 'creatureDamage', dice: d(1, 6), type: 'slashing' })
    expect(knMonsterFumble(10)).toMatchObject({ kind: 'creatureDamage', dice: d(2, 6), type: 'bludgeoning', buff: { lostTurn: 1 } })
  })

  it('les effets de créature tiennent dans le schéma', () => {
    for (const roll of [1, 2, 3, 6, 7, 8, 10]) {
      const move = knMonsterFumble(roll)
      const buff = move.kind === 'creatureBuff' ? move.buff : move.kind === 'creatureDamage' ? move.buff : undefined
      expect(buff && knCreatureBuffSchema.safeParse(buff).success, `résultat ${roll}`).toBe(true)
    }
  })
})

describe('tours perdus et Avantage défensif', () => {
  it('chaque tirage d\'action d\'une créature qui a perdu des tours en consomme un', () => {
    let run = knAddCreatureBuff(fight(), 0, { label: 'Étourdie', lostTurn: 2 })

    const first = knConsumeLostTurn(run, 0)
    expect(first.label).toBe('Étourdie')
    expect(first.run.combat?.creatures[0]?.effects).toEqual([{ label: 'Étourdie', lostTurn: 1 }])

    const second = knConsumeLostTurn(first.run, 0)
    expect(second.label).toBe('Étourdie')
    expect(second.run.combat?.creatures[0]?.effects).toEqual([])
    run = second.run

    expect(knConsumeLostTurn(run, 0).label).toBeUndefined()
    expect(knConsumeLostTurn(fight(), 1).label).toBeUndefined()
  })

  it('l\'Avantage défensif perd un round à chaque round qui passe', () => {
    let run = knSetDefenseAdvantage(fight(), 2)

    expect(run.combat?.defenseAdvantage).toBe(2)
    run = knNextCombatRound(run)
    expect(run.combat?.defenseAdvantage).toBe(1)
    run = knNextCombatRound(run)
    expect(run.combat).not.toHaveProperty('defenseAdvantage')
    expect(knSetDefenseAdvantage(emptyKnRun(), 2)).toEqual(emptyKnRun())
  })
})

describe('Saignement d\'une créature et immunité du survivant', () => {
  it('le Saignement se cumule et coûte sa valeur en Santé à chaque round, l\'Armure ignorée', () => {
    let run = knBleedCreature(fight(), 0, 1)
    run = knBleedCreature(run, 0, 1)

    expect(run.combat?.creatures[0]?.effects).toEqual([{ label: 'Saignement', bleeding: 2 }])
    expect(knNextCombatRound(run).combat?.creatures.map(creature => creature.health)).toEqual([3, 5])
    expect(knNextCombatRound(knNextCombatRound(run)).combat?.creatures[0]?.health).toBe(1)
    expect(knBleedCreature(emptyKnRun(), 0, 1)).toEqual(emptyKnRun())
  })

  it('l\'immunité aux conditions se pose et se retire', () => {
    const run = knSetImmuneConditions(fight(), true)

    expect(run.combat?.immuneConditions).toBe(true)
    expect(knSetImmuneConditions(run, false).combat).not.toHaveProperty('immuneConditions')
  })
})

describe('dé de Tension qui recommence plus haut', () => {
  it('le dé de départ se règle et se rétablit, sans changer le run quand rien ne change', () => {
    const run = emptyKnRun()
    const raised = knSetTensionStart(run, 10)

    expect(knTensionStart(run)).toBe(8)
    expect(knTensionStart(raised)).toBe(10)
    expect(knSetTensionStart(raised, 10)).toBe(raised)
    expect(knSetTensionStart(run, undefined)).toBe(run)
    expect(knSetTensionStart(run, 8)).toBe(run)
    expect(knSetTensionStart(raised, undefined)).not.toHaveProperty('tensionStart')
  })

  it('un nouveau Domaine et une Tension déclenchée remettent le dé à ce départ', () => {
    const raised = knSetTensionStart({ ...emptyKnRun(), tensionDie: 6 }, 10)

    expect(knNewDomain(raised).tensionDie).toBe(10)
    expect(knTensionCheck({ ...raised, tensionDie: 4 }, 1)).toMatchObject({ triggered: true, run: { tensionDie: 10 } })
  })
})
