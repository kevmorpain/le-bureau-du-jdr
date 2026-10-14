import { describe, it, expect } from 'vitest'
import { defaultKnSkills } from '../../shared/ker-nethalas/character'
import { knCannotBeSurprised, knFearLoss } from '../../shared/ker-nethalas/creatures'
import { KN_DUAL_WIELD, knAttackOptions, knBreakItem, knDefenseOptions, knDualPair, knFreeHands, knMendItem, knSacrificeChoices } from '../../shared/ker-nethalas/equipment'
import { knUseBandage, type KnBandageInput } from '../../shared/ker-nethalas/healing'
import { knInventorySchema, type KnItem } from '../../shared/ker-nethalas/inventory'
import { knIsWorn } from '../../shared/ker-nethalas/magicEffects'
import { resolveKnSheet } from '../../shared/ker-nethalas/resolve'
import { emptyKnRun, knCurrentDomain, knDefeatOverseer, knNewDomain, knNextCombatRound, knResolveCombatFear, knRunSchema, knSetCombatDual, knSetCombatLamp, knSpillLamp, knStartCombat, knUseFreeParry, type KnRun } from '../../shared/ker-nethalas/run'
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

describe('combat à deux armes', () => {
  const sword = (id: string, place: KnItem['place'], traits: ('twoHanded' | 'simple' | 'parrying' | 'powerful')[] = []): KnItem =>
    ({ id, name: id, kind: 'weapon', weight: 'normal', quantity: 1, place, weapon: { skill: 'bladedWeapons', speed: 0, damageType: 'slashing', traits } })
  const pair = [sword('a', 'mainHand', ['simple']), sword('b', 'offHand', ['powerful'])]
  const fighting = () => knStartCombat(emptyKnRun(), [{ ref: 'x', name: 'X', health: 5, maxHealth: 5 }])

  it('il faut une arme à une main dans chaque main', () => {
    expect(knDualPair(pair)?.map(item => item.id)).toEqual(['a', 'b'])
    expect(knDualPair([sword('a', 'mainHand', ['twoHanded'])])).toBeNull()
    expect(knDualPair([sword('a', 'mainHand'), { ...sword('s', 'offHand'), kind: 'shield', weapon: undefined }])).toBeNull()
    expect(knDualPair([sword('a', 'mainHand')])).toBeNull()
  })

  it('seule l\'arme dominante attaque, à −40 et +1 dégât, avec ses seuls Traits', () => {
    const options = knAttackOptions(pair, [], [], 'a')

    expect(options.map(option => option.id)).toEqual(['a', 'unarmed'])
    expect(options[0]).toMatchObject({ pool: 'D6+1', bonus: 10 + KN_DUAL_WIELD.attack })
    expect(knAttackOptions(pair, [], [], 'b')[0]).toMatchObject({ id: 'b', pool: 'D6+1+1', bonus: KN_DUAL_WIELD.attack })
    expect(knAttackOptions(pair).map(option => option.id)).toEqual(['a', 'b', 'unarmed'])
    expect(knAttackOptions(pair, [], [], 'inconnue').map(option => option.id)).toEqual(['a', 'b', 'unarmed'])
  })

  it('une Parade gratuite avec l\'arme dominante, même sans le Trait Parade', () => {
    const options = knDefenseOptions(pair, 'a')
    const parries = options.filter(option => option.kind === 'parry')

    expect(parries).toHaveLength(1)
    expect(parries[0]).toMatchObject({ id: 'parry:a', free: true })
    expect(knDefenseOptions(pair).some(option => option.kind === 'parry')).toBe(false)
  })

  it('l\'arme dominante et la Parade gratuite se retiennent dans le combat, la Parade se libère au round suivant', () => {
    const dual = knSetCombatDual(fighting(), 'a')
    const used = knUseFreeParry(dual)

    expect(dual.combat?.dual).toBe('a')
    expect(used.combat?.freeParryUsed).toBe(true)
    expect(used.combat?.reactions).toBe(0)
    expect(knNextCombatRound(used).combat?.freeParryUsed).toBeUndefined()
    expect(knNextCombatRound(used).combat?.dual).toBe('a')
    expect(knSetCombatDual(dual, null).combat?.dual).toBeUndefined()
    expect(knRunSchema.safeParse(used).success).toBe(true)
    const calm = emptyKnRun()
    expect(knSetCombatDual(calm, 'a')).toBe(calm)
  })
})

describe('arme ou bouclier sacrifié', () => {
  const blade: KnItem = { id: 'w', name: 'Épée', kind: 'weapon', weight: 'normal', quantity: 1, place: 'mainHand', weapon: { skill: 'bladedWeapons', speed: 0, damageType: 'slashing', traits: ['parrying'] } }
  const buckler: KnItem = { id: 's', name: 'Bouclier', kind: 'shield', weight: 'normal', quantity: 1, place: 'offHand', parry: 10 }
  const spare: KnItem = { id: 'x', name: 'Dague', kind: 'weapon', weight: 'light', quantity: 1, place: 'bag', weapon: { skill: 'bladedWeapons', speed: 0, damageType: 'piercing', traits: [] } }
  const kit = [blade, buckler, spare]

  it('on sacrifie ce qui est tenu, pas ce qui dort dans le sac', () => {
    expect(knSacrificeChoices(kit).map(item => item.id)).toEqual(['w', 's'])
    expect(knSacrificeChoices(knBreakItem(kit, 'w')).map(item => item.id)).toEqual(['s'])
  })

  it('un objet brisé ne sert plus : ni attaque, ni parade, ni magie', () => {
    const brokenBlade = knBreakItem(kit, 'w')
    const brokenShield = knBreakItem(kit, 's')

    expect(knAttackOptions(brokenBlade).map(option => option.id)).toEqual(['unarmed'])
    expect(knDefenseOptions(brokenBlade).map(option => option.id)).toEqual(['dodge'])
    expect(knDefenseOptions(brokenShield).map(option => option.id)).toEqual(['dodge', 'parry:w'])
    expect(knDefenseOptions(brokenShield).find(option => option.id === 'parry:w')?.bonus).toBe(0)
    expect(knIsWorn(brokenBlade[0]!)).toBe(false)
    expect(knIsWorn(blade)).toBe(true)
    expect(knDualPair([blade, { ...buckler, kind: 'weapon', weapon: blade.weapon }])).not.toBeNull()
    expect(knDualPair(knBreakItem([blade, { ...buckler, kind: 'weapon', weapon: blade.weapon }], 's'))).toBeNull()
  })

  it('la réparation remet l\'objet en service, tel qu\'il était', () => {
    const mended = knMendItem(knBreakItem(kit, 'w'), 'w')

    expect(mended[0]).toEqual(blade)
    expect(mended[0]).not.toHaveProperty('broken')
    expect(knInventorySchema.safeParse(knBreakItem(kit, 'w')).success).toBe(true)
  })
})
