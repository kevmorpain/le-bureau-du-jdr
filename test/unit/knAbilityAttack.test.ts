import { describe, expect, it } from 'vitest'
import {
  KN_EMPTY_ATTACK_PLAN,
  knAttackAbilities,
  knAttackAbilityBlockers,
  knAttackPlan,
  knDodgeAbilities,
  knEngravableWeapons,
  knEngrave,
  knMarkAbilities,
  knMarkPlan,
  knMergePlans,
  knPermanentEffects,
  knSpendAttackAbilities,
  knSustainedAttackAbilities,
} from '../../shared/ker-nethalas/abilityAttack'
import { knAttackOptions } from '../../shared/ker-nethalas/equipment'
import { KN_NO_DEFENSE, knCombatExchange, knRollDamagePool } from '../../shared/ker-nethalas/combat'
import { knAbilityIsUsable } from '../../shared/ker-nethalas/masteryEffects'
import { knMasteryAbilitySchema, type KnAbilityAttack, type KnMastery } from '../../shared/ker-nethalas/masteries'
import { emptyKnRun, knMarkCreature, knSetCombatDefense, knStartCombat } from '../../shared/ker-nethalas/run'
import { emptyKnStatus } from '../../shared/ker-nethalas/status'
import { fakeMastery } from '../fixtures/knMasteries'

const d = (count: number, sides: number, bonus = 0) => ({ count, sides, bonus })

const withAttacks = (attacks: Record<number, { attack: KnAbilityAttack, sustained?: boolean, aether?: number | null, limit?: 'combat' | 'room' }>): KnMastery => {
  const base = fakeMastery('alpha')
  return { ...base, abilities: base.abilities.map(ability => attacks[ability.tier] ? { ...ability, ...attacks[ability.tier] } : ability) }
}

const entries = (tiers: number) => [{ key: 'alpha', tiers, amulet: false }]
const sequence = (...values: number[]) => {
  let i = 0
  return () => (values[i++ % values.length]! - 0.5) / 6
}

describe('format d\'une aptitude d\'attaque', () => {
  const ability = fakeMastery('alpha').abilities[0]!

  it('accepte bonus, dés typés, critique, défense, seconde attaque et marque', () => {
    const attack = {
      bonus: 40,
      dice: [{ dice: d(1, 6), type: 'infernal' }, { dice: d(0, 0, 1) }],
      pool: [{ dice: d(2, 8), type: 'bludgeoning' }],
      critical: true,
      undefendable: true,
      followUp: { dice: [{ dice: d(1, 4), type: 'bludgeoning' }] },
      allTargets: true,
      mark: true,
      afterDefense: -20,
      noDefense: true,
    }
    expect(knMasteryAbilitySchema.safeParse({ ...ability, attack }).success).toBe(true)
  })

  it('refuse un type de dégâts inconnu', () => {
    expect(knMasteryAbilitySchema.safeParse({ ...ability, attack: { dice: [{ dice: d(1, 6), type: 'inconnu' }] } }).success).toBe(false)
  })
})

describe('choix des aptitudes d\'attaque', () => {
  const mastery = withAttacks({
    1: { attack: { bonus: 40 } },
    2: { attack: { dice: [{ dice: d(1, 6), type: 'infernal' }] }, sustained: true, aether: 5 },
    3: { attack: { mark: true, bonus: 10 } },
    4: { attack: { critical: true }, limit: 'room', aether: null },
  })

  it('se coche : ni Maintenue ni marque, et seulement si le palier est débloqué', () => {
    expect(knAttackAbilities([mastery], entries(5)).map(entry => entry.ability.tier)).toEqual([1, 4])
    expect(knAttackAbilities([mastery], entries(3)).map(entry => entry.ability.tier)).toEqual([1])
    expect(knAttackAbilities([mastery], [])).toEqual([])
  })

  it('une aptitude Maintenue ne compte que si elle est allumée', () => {
    expect(knSustainedAttackAbilities([mastery], entries(5), [])).toEqual([])
    expect(knSustainedAttackAbilities([mastery], entries(5), ['alpha:2']).map(entry => entry.ability.tier)).toEqual([2])
  })

  it('les marques de cible sont à part', () => {
    expect(knMarkAbilities([mastery], entries(5)).map(entry => entry.ability.tier)).toEqual([3])
  })

  it('une aptitude d\'attaque non Maintenue n\'a pas de bouton d\'usage, une Maintenue oui', () => {
    const [first, second] = mastery.abilities
    expect(knAbilityIsUsable(first!)).toBe(false)
    expect(knAbilityIsUsable(second!)).toBe(true)
  })

  it('une limite atteinte ou un coût impayable la bloque', () => {
    const [entry] = knAttackAbilities([mastery], entries(5)).filter(candidate => candidate.ability.tier === 4)
    const purse = { aetherCurrent: 0, healthCurrent: 5, exhaustion: 0 }
    expect(knAttackAbilityBlockers(entry!, purse, emptyKnStatus())).toEqual([])
    expect(knAttackAbilityBlockers(entry!, purse, { ...emptyKnStatus(), used: [{ key: 'alpha:4', limit: 'room' }] })).toEqual(['Déjà utilisée'])
  })
})

describe('plan d\'attaque', () => {
  it('additionne les bonus, joint les dés, retient réserve, critique, défense et seconde attaque', () => {
    const mastery = withAttacks({
      1: { attack: { bonus: 40, dice: [{ dice: d(1, 4), type: 'holy' }], critical: true } },
      2: { sustained: false, attack: { bonus: -10, undefendable: true, allTargets: true, followUp: {}, afterDefense: -20, noDefense: true, pool: [{ dice: d(2, 8), type: 'bludgeoning' }] } },
    })
    const plan = knAttackPlan(knAttackAbilities([mastery], entries(2)))

    expect(plan).toEqual({
      bonus: 30,
      dice: [{ count: 1, sides: 4, bonus: 0, type: 'holy' }],
      pool: [{ count: 2, sides: 8, bonus: 0, type: 'bludgeoning' }],
      critical: true,
      undefendable: true,
      allTargets: true,
      followUp: { dice: undefined },
      afterDefense: -20,
      afterDefenseIfHit: 0,
      noDamage: false,
      stripArmor: false,
      noDefense: true,
      onKill: [],
      advantage: false,
      freeAim: false,
    })
  })

  it('sans aptitude, le plan ne change rien', () => {
    expect(knAttackPlan([])).toEqual(KN_EMPTY_ATTACK_PLAN)
  })

  it('une marque se joue comme un plan de bonus et de dés, et les plans se fusionnent', () => {
    const marked = knMarkPlan({ bonus: 10, dice: [{ dice: d(0, 0, 1) }] })
    const merged = knMergePlans(marked, { ...KN_EMPTY_ATTACK_PLAN, bonus: 40, dice: [], critical: true })

    expect(merged).toMatchObject({ bonus: 50, critical: true, dice: [{ count: 0, sides: 0, bonus: 1 }] })
    expect(knMarkPlan(undefined)).toEqual(KN_EMPTY_ATTACK_PLAN)
  })

  it('payer coûte l\'Éther, l\'Épuisement et la Santé de chaque aptitude et note l\'usage limité', () => {
    const mastery = withAttacks({
      1: { attack: { bonus: 40 }, aether: 4 },
      4: { attack: { critical: true }, limit: 'room', aether: null },
    })
    const chosen = knAttackAbilities([mastery], entries(5))
    const spent = knSpendAttackAbilities(chosen, { aetherCurrent: 10, healthCurrent: 8, exhaustion: 1 }, emptyKnStatus())

    expect(spent.purse).toEqual({ aetherCurrent: 6, healthCurrent: 8, exhaustion: 1 })
    expect(spent.status.used).toEqual([{ key: 'alpha:4', limit: 'room' }])
  })
})

describe('dés typés et défense', () => {
  it('le dé retenu donne son type de dégâts à l\'attaque, le premier l\'emportant à égalité', () => {
    const rolls = knRollDamagePool([d(1, 6), { ...d(1, 6), type: 'infernal' }], sequence(3, 5))
    expect(rolls).toMatchObject({ picked: 5, pickedType: 'infernal', total: 5 })

    const tie = knRollDamagePool([d(1, 6), { ...d(1, 6), type: 'infernal' }], sequence(4, 4))
    expect(tie.pickedType).toBeUndefined()
  })

  it('sans dé typé, aucun type n\'est retenu', () => {
    expect(knRollDamagePool([d(2, 6)], sequence(2, 6))).not.toHaveProperty('pickedType')
  })

  it('une cible qui ne se défend pas est touchée dès que l\'attaque réussit', () => {
    const success = { roll: 20, value: 20, swapped: false, mode: 'normal' as const, target: 50, success: true, doubles: false, critical: null }
    const failure = { ...success, value: 80, target: 50, success: false }

    expect(knCombatExchange(success, KN_NO_DEFENSE).outcome).toBe('hit')
    expect(knCombatExchange(failure, KN_NO_DEFENSE).outcome).toBe('bothFail')
  })

  it('marquer une créature et régler la défense du survivant', () => {
    const run = knStartCombat(emptyKnRun(), [{ name: 'A', health: 5, maxHealth: 5 }, { name: 'B', health: 5, maxHealth: 5 }])
    const marked = knMarkCreature(run, 1, { bonus: 10, dice: [{ dice: d(0, 0, 1) }] })

    expect(marked.combat?.creatures[1]?.mark).toEqual({ bonus: 10, dice: [{ dice: d(0, 0, 1) }] })
    expect(marked.combat?.creatures[0]?.mark).toBeUndefined()

    const defended = knSetCombatDefense(run, { bonus: -20, none: true })
    expect(defended.combat).toMatchObject({ defenseBonus: -20, noDefense: true })
    expect(knSetCombatDefense(defended, {}).combat).not.toHaveProperty('noDefense')
    expect(knSetCombatDefense(emptyKnRun(), { none: true })).toEqual(emptyKnRun())
  })
})

describe('aptitudes de réaction, sans dégâts et défense après une touche', () => {
  const mastery = withAttacks({
    1: { attack: { afterDodge: 20 } },
    2: { sustained: false, attack: { afterDefenseIfHit: 10, noDamage: true, stripArmor: true } },
  })

  it('une réaction à l\'Esquive ne se coche pas dans l\'attaque : elle a son propre bouton', () => {
    expect(knAttackAbilities([mastery], entries(2)).map(entry => entry.ability.tier)).toEqual([2])
    expect(knDodgeAbilities([mastery], entries(2)).map(entry => entry.ability.tier)).toEqual([1])
  })

  it('le plan retient le bonus défensif sur touche, l\'absence de dégâts et le retrait d\'Armure', () => {
    const plan = knAttackPlan(knAttackAbilities([mastery], entries(2)))

    expect(plan).toMatchObject({ afterDefenseIfHit: 10, noDamage: true, stripArmor: true, afterDefense: 0 })
    expect(knMergePlans(plan, { ...KN_EMPTY_ATTACK_PLAN, dice: [], advantage: true, freeAim: true })).toMatchObject({ advantage: true, freeAim: true, afterDefenseIfHit: 10 })
  })
})

describe('effets permanents, gravure et effet à la mort', () => {
  const permanentMastery = (permanent: Record<string, unknown>, tier = 1): KnMastery => {
    const base = fakeMastery('alpha')
    return { ...base, abilities: base.abilities.map(ability => ability.tier === tier ? { ...ability, permanent } : ability) as KnMastery['abilities'] }
  }

  it('les effets permanents des aptitudes débloquées s\'additionnent', () => {
    const effects = knPermanentEffects([permanentMastery({ resistant: ['slashing'], immune: ['bludgeoning'], damageType: 'psychic', healOnDamage: 1 })], entries(2))

    expect(effects).toEqual({ resistant: ['slashing'], immune: ['bludgeoning'], restored: [], damageType: 'psychic', healOnDamage: 1 })
    expect(knPermanentEffects([permanentMastery({ healOnDamage: 1 }, 3)], entries(2))).toEqual({ resistant: [], immune: [], restored: [], healOnDamage: 0 })
  })

  it('un effet à la mort se retrouve dans le plan', () => {
    const mastery = withAttacks({ 1: { attack: { onKill: [{ kind: 'recover', vital: 'sanity', dice: d(1, 6) }] } } })

    expect(knAttackPlan(knAttackAbilities([mastery], entries(1))).onKill).toEqual([{ kind: 'recover', vital: 'sanity', dice: d(1, 6) }])
  })

  it('une arme ne se grave qu\'une fois', () => {
    const sword = { id: 'w', name: 'Épée', kind: 'weapon', weight: 'normal', quantity: 1, place: 'mainHand', weapon: { skill: 'bladedWeapons', speed: 5, damageType: 'slashing', traits: [] } } as const
    const dice = [{ dice: d(1, 10), type: 'arcane' as const }]
    const engraved = knEngrave([sword], 'w', dice)

    expect(engraved[0]).toMatchObject({ engraved: dice })
    expect(knEngravableWeapons([sword]).map(item => item.id)).toEqual(['w'])
    expect(knEngravableWeapons(engraved)).toEqual([])
    expect(knEngrave(engraved, 'w', [{ dice: d(1, 4) }])[0]?.engraved).toEqual(dice)
  })

  it('une arme gravée ajoute ses dés typés à ses attaques, hors du texte de la réserve', () => {
    const sword = { id: 'w', name: 'Épée', kind: 'weapon', weight: 'normal', quantity: 1, place: 'mainHand', weapon: { skill: 'bladedWeapons', speed: 5, damageType: 'slashing', traits: [] }, engraved: [{ dice: d(1, 10), type: 'arcane' }] } as const
    const [option] = knAttackOptions([{ ...sword, engraved: [...sword.engraved] }])

    expect(option).toMatchObject({ pool: 'D6', typed: [{ count: 1, sides: 10, bonus: 0, type: 'arcane' }] })
  })
})
