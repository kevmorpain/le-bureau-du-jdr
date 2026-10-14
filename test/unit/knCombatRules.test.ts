import { describe, it, expect } from 'vitest'
import { defaultKnSkills } from '../../shared/ker-nethalas/character'
import { knCannotBeSurprised, knFearLoss } from '../../shared/ker-nethalas/creatures'
import { knFreeHands } from '../../shared/ker-nethalas/equipment'
import { knUseBandage, type KnBandageInput } from '../../shared/ker-nethalas/healing'
import type { KnItem } from '../../shared/ker-nethalas/inventory'
import { resolveKnSheet } from '../../shared/ker-nethalas/resolve'
import { emptyKnRun, knCurrentDomain, knDefeatOverseer, knNewDomain, knResolveCombatFear, knRunSchema, knSetCombatLamp, knSpillLamp, knStartCombat, type KnRun } from '../../shared/ker-nethalas/run'
import { emptyKnStatus, knStatusSchema } from '../../shared/ker-nethalas/status'
import { knResetUses } from '../../shared/ker-nethalas/vitals'

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

describe('Bandage hors combat', () => {
  const input = (over: Partial<KnBandageInput> = {}): KnBandageInput => ({ toughness: 10, toughnessMax: 25, bandages: 2, status: emptyKnStatus(), ...over })
  const die = (result: number) => () => (result - 0.5) / 4

  it('soigne D4 Robustesse, consomme un Bandage et se range sur la salle', () => {
    const result = knUseBandage(input(), die(3))

    if ('error' in result) throw new Error(result.error)
    expect(result).toMatchObject({ toughness: 13, bandages: 1, roll: 3 })
    expect(result.status.used).toEqual([{ key: 'bandage', limit: 'room' }])
    expect(knStatusSchema.safeParse(result.status).success).toBe(true)
  })

  it('ne dépasse pas le maximum de Robustesse, ni ne déborde sur la Santé', () => {
    const result = knUseBandage(input({ toughness: 24 }), die(4))

    expect(result).toMatchObject({ toughness: 25 })
    expect(knUseBandage(input({ toughness: 30 }), die(2))).toMatchObject({ toughness: 30 })
  })

  it('une seule fois par salle, et seulement avec un Bandage', () => {
    const used = knUseBandage(input(), die(1))
    if ('error' in used) throw new Error(used.error)

    expect(knUseBandage(input({ status: used.status }))).toEqual({ error: 'usedThisRoom' })
    expect(knUseBandage(input({ bandages: 0 }))).toEqual({ error: 'noBandage' })
    expect(knUseBandage(input({ status: knResetUses(used.status, ['room']) }), die(2))).toMatchObject({ roll: 2 })
  })
})

describe('lampe en combat', () => {
  const weapon = (id: string, place: KnItem['place'], traits: readonly ('twoHanded' | 'simple')[] = []): KnItem =>
    ({ id, name: id, kind: 'weapon', weight: 'normal', quantity: 1, place, weapon: { skill: 'bladedWeapons', speed: 0, damageType: 'slashing', traits: [...traits] } })
  const shield: KnItem = { id: 's', name: 'Bouclier', kind: 'shield', weight: 'normal', quantity: 1, place: 'offHand' }
  const fighting = () => knStartCombat(emptyKnRun(), [{ ref: 'x', name: 'X', health: 5, maxHealth: 5 }])

  it('les mains libres : une arme à deux mains les prend toutes les deux', () => {
    expect(knFreeHands([])).toBe(2)
    expect(knFreeHands([weapon('a', 'mainHand')])).toBe(1)
    expect(knFreeHands([weapon('a', 'mainHand'), shield])).toBe(0)
    expect(knFreeHands([weapon('a', 'mainHand'), weapon('b', 'offHand')])).toBe(0)
    expect(knFreeHands([weapon('a', 'mainHand', ['twoHanded'])])).toBe(0)
    expect(knFreeHands([weapon('a', 'bag')])).toBe(2)
  })

  it('poser puis reprendre la lampe, seulement pendant un combat', () => {
    const down = knSetCombatLamp(fighting(), true)

    expect(down.combat?.lampDown).toBe(true)
    expect(knRunSchema.safeParse(down).success).toBe(true)
    expect(knSetCombatLamp(down, false).combat?.lampDown).toBeUndefined()
    const calm = emptyKnRun()
    expect(knSetCombatLamp(calm, true)).toBe(calm)
  })

  it('une lampe renversée n\'éclaire plus : la lumière restante tombe à 0', () => {
    const spilled = knSpillLamp(knSetCombatLamp(fighting(), true))

    expect(spilled.lightRemaining).toBe(0)
    expect(spilled.combat?.lampDown).toBeUndefined()
    expect(knRunSchema.safeParse(spilled).success).toBe(true)
  })
})
