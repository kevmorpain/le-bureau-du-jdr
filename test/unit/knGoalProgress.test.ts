import { describe, it, expect } from 'vitest'
import { knGoalCountSchema, knGoalIncrement, type KnGoalCount, type KnGoalEvent } from '../../shared/ker-nethalas/goalCounts'
import { knApplyGoalEvents } from '../../shared/ker-nethalas/goalProgress'
import { knGoalPicksSchema, knPersonalGoalSchema, type KnGoalPick, type KnPersonalGoal } from '../../shared/ker-nethalas/goals'
import { emptyKnRun, knMarkCreatureSlain, knRunSchema, knStartCombat } from '../../shared/ker-nethalas/run'

const goal = (key: string, counts: KnGoalCount | undefined, target = 3): KnPersonalGoal => ({
  key, name: key, objective: 'objectif', target, reward: 'récompense', ...(counts ? { counts } : {}),
})
const pick = (key: string, progress = 0, claimed = false): KnGoalPick => ({ key, progress, claimed })

describe('ce que les événements ajoutent au compteur', () => {
  const defeat: KnGoalEvent = { kind: 'defeat', types: ['undead'], skill: 'bladedWeapons' }

  it('un adversaire vaincu : tous, d\'un type, d\'une compétence d\'arme, ou un Overseer', () => {
    expect(knGoalIncrement({ kind: 'defeat' }, defeat)).toBe(1)
    expect(knGoalIncrement({ kind: 'defeat', creature: 'undead' }, defeat)).toBe(1)
    expect(knGoalIncrement({ kind: 'defeat', creature: 'plant' }, defeat)).toBe(0)
    expect(knGoalIncrement({ kind: 'defeat', skill: 'bladedWeapons' }, defeat)).toBe(1)
    expect(knGoalIncrement({ kind: 'defeat', skill: 'shaftedWeapons' }, defeat)).toBe(0)
    expect(knGoalIncrement({ kind: 'defeat', skill: 'bladedWeapons' }, { kind: 'defeat', types: [] })).toBe(0)
    expect(knGoalIncrement({ kind: 'defeat', overseer: true }, defeat)).toBe(0)
    expect(knGoalIncrement({ kind: 'defeat', overseer: true }, { ...defeat, overseer: true })).toBe(1)
  })

  it('les dégâts comptent leur montant, d\'un seul type', () => {
    expect(knGoalIncrement({ kind: 'damage', damage: 'fire' }, { kind: 'damage', damage: 'fire', amount: 7 })).toBe(7)
    expect(knGoalIncrement({ kind: 'damage', damage: 'fire' }, { kind: 'damage', damage: 'cold', amount: 7 })).toBe(0)
    expect(knGoalIncrement({ kind: 'damage', damage: 'fire' }, { kind: 'damage', damage: 'fire', amount: -2 })).toBe(0)
  })

  it('les pièces et les adversaires surpris comptent leur quantité, les autres événements un', () => {
    expect(knGoalIncrement({ kind: 'coins' }, { kind: 'coins', amount: 40 })).toBe(40)
    expect(knGoalIncrement({ kind: 'surprise' }, { kind: 'surprise', creatures: 3 })).toBe(3)
    for (const kind of ['lockpick', 'critical', 'relic', 'scavenge', 'reason', 'trap', 'darkness', 'loreBook'] as const) {
      expect(knGoalIncrement({ kind }, { kind })).toBe(1)
      expect(knGoalIncrement({ kind }, { kind: kind === 'relic' ? 'trap' : 'relic' })).toBe(0)
    }
  })
})

describe('le progrès des objectifs en cours', () => {
  it('fait avancer ceux qui comptent l\'événement, et eux seuls', () => {
    const goals = [goal('a', { kind: 'critical' }), goal('b', { kind: 'relic' }), goal('c', undefined)]
    const { picks, reached } = knApplyGoalEvents([pick('a', 1), pick('b'), pick('c', 2)], goals, [{ kind: 'critical' }, { kind: 'critical' }])

    expect(picks.map(entry => entry.progress)).toEqual([3, 0, 2])
    expect(reached).toEqual(['a'])
  })

  it('un objectif sans compteur, récupéré ou inconnu ne bouge pas', () => {
    const goals = [goal('a', { kind: 'critical' })]
    const picks = [pick('a', 1, true), pick('inconnu', 1)]

    expect(knApplyGoalEvents(picks, goals, [{ kind: 'critical' }]).picks).toEqual(picks)
    expect(knApplyGoalEvents([pick('a', 1)], goals, []).picks[0]!.progress).toBe(1)
  })

  it('la cible n\'est annoncée qu\'une fois, et le progrès a un plafond', () => {
    const goals = [goal('a', { kind: 'coins' }, 100)]

    expect(knApplyGoalEvents([pick('a', 90)], goals, [{ kind: 'coins', amount: 20 }]).reached).toEqual(['a'])
    expect(knApplyGoalEvents([pick('a', 150)], goals, [{ kind: 'coins', amount: 20 }]).reached).toEqual([])
    expect(knApplyGoalEvents([pick('a', 99990)], goals, [{ kind: 'coins', amount: 5000 }]).picks[0]!.progress).toBe(99999)
  })

  it('plusieurs événements s\'additionnent', () => {
    const goals = [goal('a', { kind: 'damage', damage: 'acid' }, 200)]
    const events: KnGoalEvent[] = [{ kind: 'damage', damage: 'acid', amount: 5 }, { kind: 'damage', damage: 'fire', amount: 9 }, { kind: 'damage', damage: 'acid', amount: 4 }]

    expect(knApplyGoalEvents([pick('a')], goals, events).picks[0]!.progress).toBe(9)
  })
})

describe('format', () => {
  it('chaque sorte de compteur se valide, un seul critère de défaite à la fois', () => {
    const counts: KnGoalCount[] = [
      { kind: 'defeat' }, { kind: 'defeat', creature: 'astral' }, { kind: 'defeat', skill: 'unarmedCombat' }, { kind: 'defeat', overseer: true },
      { kind: 'damage', damage: 'lightning' }, { kind: 'coins' }, { kind: 'surprise' }, { kind: 'lockpick' }, { kind: 'critical' },
      { kind: 'relic' }, { kind: 'scavenge' }, { kind: 'reason' }, { kind: 'trap' }, { kind: 'darkness' }, { kind: 'loreBook' },
    ]

    for (const count of counts) expect(knGoalCountSchema.safeParse(count).success).toBe(true)
    expect(knGoalCountSchema.safeParse({ kind: 'defeat', creature: 'astral', skill: 'bladedWeapons' }).success).toBe(false)
    expect(knGoalCountSchema.safeParse({ kind: 'damage', damage: 'inconnu' }).success).toBe(false)
    expect(knGoalCountSchema.safeParse({ kind: 'magie' }).success).toBe(false)
  })

  it('un objectif peut porter un compteur, ou non : le contenu déjà écrit reste valide', () => {
    expect(knPersonalGoalSchema.safeParse(goal('a', { kind: 'trap' })).success).toBe(true)
    expect(knPersonalGoalSchema.safeParse(goal('a', undefined)).success).toBe(true)
    expect(knGoalPicksSchema.safeParse([pick('a', 5)]).success).toBe(true)
  })
})

describe('adversaire vaincu par une compétence d\'arme', () => {
  const fighting = () => knStartCombat(emptyKnRun(), [{ ref: 'x', name: 'X', health: 0, maxHealth: 5 }])

  it('le combat retient la compétence du coup fatal', () => {
    const slain = knMarkCreatureSlain(fighting(), 0, 'shaftedWeapons')

    expect(slain.combat?.creatures[0]?.slainBy).toBe('shaftedWeapons')
    expect(knRunSchema.safeParse(slain).success).toBe(true)
    const calm = emptyKnRun()
    expect(knMarkCreatureSlain(calm, 0, 'bladedWeapons')).toBe(calm)
    expect(knMarkCreatureSlain(fighting(), 3, 'bladedWeapons').combat?.creatures[0]?.slainBy).toBeUndefined()
  })
})
