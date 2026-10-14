import { describe, it, expect } from 'vitest'
import { defaultKnSkills } from '../../shared/ker-nethalas/character'
import { resolveKnSheet } from '../../shared/ker-nethalas/resolve'
import { emptyKnRun, knCurrentDomain, knDefeatOverseer, knNewDomain, knRunSchema, type KnRun } from '../../shared/ker-nethalas/run'
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
