import { describe, it, expect } from 'vitest'
import { defaultKnSkills } from '../../shared/ker-nethalas/character'
import { knCannotBeSurprised, knFearLoss } from '../../shared/ker-nethalas/creatures'
import { resolveKnSheet } from '../../shared/ker-nethalas/resolve'
import { emptyKnRun, knCurrentDomain, knDefeatOverseer, knNewDomain, knResolveCombatFear, knRunSchema, knStartCombat, type KnRun } from '../../shared/ker-nethalas/run'
import { emptyKnStatus } from '../../shared/ker-nethalas/status'

const resolve = (run: KnRun) => resolveKnSheet({
  skills: defaultKnSkills(),
  extraSkills: [],
  resistances: { endurance: 40, resolve: 20, spellward: 20 },
  exhaustion: 0,
  maxVitals: { health: 15, toughness: 25, aether: 12, sanity: 14 },
  status: emptyKnStatus(),
  run,
})

const withInfluences = (): KnRun => {
  const run = emptyKnRun()
  return { ...run, domains: [{ ...run.domains[0]!, overseerInfluences: ['tough'] }] }
}

describe('Overseer vaincu', () => {
  it('ses influences ne sont plus rappelées sur la fiche, mais restent dans le Domaine', () => {
    const run = withInfluences()
    const defeated = knDefeatOverseer(run)

    expect(JSON.stringify(resolve(run).reminders)).toContain('ker_nethalas.overseer.tough')
    expect(JSON.stringify(resolve(defeated).reminders)).not.toContain('ker_nethalas.overseer.tough')
    expect(knCurrentDomain(defeated).overseerInfluences).toHaveLength(1)
    expect(knRunSchema.safeParse(defeated).success).toBe(true)
  })

  it('ne concerne que le Domaine courant', () => {
    const second = knNewDomain(emptyKnRun())
    const defeated = knDefeatOverseer(second)

    expect(knCurrentDomain(defeated).overseerDefeated).toBe(true)
    expect(defeated.domains[0]!.overseerDefeated).toBeUndefined()
  })
})

const trait = (key: 'frightening' | 'horrifying' | 'alert' | 'pack') => ({ key })

describe('peur au début du combat', () => {
  it('la perte la plus forte de la rencontre, un seul test', () => {
    expect(knFearLoss([{ traits: [trait('frightening')] }])).toBe(2)
    expect(knFearLoss([{ traits: [trait('horrifying')] }])).toBe(4)
    expect(knFearLoss([{ traits: [trait('frightening')] }, { traits: [trait('horrifying')] }])).toBe(4)
    expect(knFearLoss([{ traits: [trait('pack')] }, { traits: [] }])).toBe(0)
    expect(knFearLoss([])).toBe(0)
  })

  it('le combat porte le test à faire, qui ne se fait qu\'une fois', () => {
    const creature = { ref: 'x', name: 'X', health: 5, maxHealth: 5 }
    const afraid = knStartCombat(emptyKnRun(), [creature], false, 2)
    const calm = knStartCombat(emptyKnRun(), [creature])

    expect(afraid.combat?.fear).toEqual({ loss: 2, resolved: false })
    expect(calm.combat?.fear).toBeUndefined()
    expect(knResolveCombatFear(afraid).combat?.fear).toEqual({ loss: 2, resolved: true })
    expect(knResolveCombatFear(calm)).toBe(calm)
    expect(knRunSchema.safeParse(knResolveCombatFear(afraid)).success).toBe(true)
  })

  it('une créature Alerte ne peut pas être surprise', () => {
    expect(knCannotBeSurprised([{ traits: [trait('pack')] }, { traits: [trait('alert')] }])).toBe(true)
    expect(knCannotBeSurprised([{ traits: [trait('pack')] }])).toBe(false)
  })
})
