import { describe, expect, it } from 'vitest'
import { knArmorAfterLoss, knWithAdvantage } from '../../shared/ker-nethalas/combat'
import { knCreatureBuffSchema } from '../../shared/ker-nethalas/combatState'
import { knMonsterMove } from '../../shared/ker-nethalas/monsterMoves'
import {
  emptyKnRun,
  knAddDefenseBonus,
  knAddNextAttack,
  knClearNextAttack,
  knLoseCreatureArmor,
  knLoseSurvivorArmor,
  knRaiseNextAttackBonus,
  knSetCombatDefense,
  knSetCreatureDefenseMalus,
  knStartCombat,
} from '../../shared/ker-nethalas/run'
import { knSurvivorMove } from '../../shared/ker-nethalas/survivorMoves'

const d = (count: number, sides: number, bonus = 0) => ({ count, sides, bonus })
const fight = () => knStartCombat(emptyKnRun(), [{ name: 'A', health: 5, maxHealth: 5 }, { name: 'B', health: 5, maxHealth: 5 }])

describe('mouvement défensif du survivant', () => {
  it('chaque résultat du D10 est lu : effet sur la prochaine attaque, l\'adversaire, le survivant, ou texte', () => {
    expect(knSurvivorMove(1)).toEqual({ kind: 'nextAttack', bonus: 10 })
    expect(knSurvivorMove(2)).toEqual({ kind: 'armorLoss', points: 1 })
    expect(knSurvivorMove(3)).toEqual({ kind: 'foeBleeding', value: 1 })
    expect(knSurvivorMove(4)).toEqual({ kind: 'immunity' })
    expect(knSurvivorMove(5)).toEqual({ kind: 'piercing', amount: 1 })
    expect(knSurvivorMove(6)).toEqual({ kind: 'nextAttack', dice: [{ dice: d(1, 6) }] })
    expect(knSurvivorMove(7)).toEqual({ kind: 'nextAttack', advantage: true })
    expect(knSurvivorMove(8)).toEqual({ kind: 'foeDefense', amount: 20 })
    expect(knSurvivorMove(9)).toEqual({ kind: 'recover', vital: 'toughness', amount: 2 })
    expect(knSurvivorMove(10)).toEqual({ kind: 'nextAttack', freeAim: true })
  })
})

describe('la prochaine attaque du survivant', () => {
  it('cumule bonus et dés, garde les drapeaux, et se vide à la première attaque', () => {
    let run = knAddNextAttack(fight(), { bonus: 10 })
    run = knAddNextAttack(run, { bonus: 10, dice: [{ dice: d(1, 6) }], advantage: true })
    run = knAddNextAttack(run, { freeAim: true })

    expect(run.combat?.next).toEqual({ bonus: 20, dice: [{ dice: d(1, 6) }], advantage: true, freeAim: true })
    expect(knClearNextAttack(run).combat).not.toHaveProperty('next')
    expect(knAddNextAttack(emptyKnRun(), { bonus: 10 })).toEqual(emptyKnRun())
  })

  it('un bonus de réaction remplace celui du mouvement défensif s\'il est plus fort, sans s\'y ajouter', () => {
    const base = knAddNextAttack(fight(), { bonus: 10 })

    expect(knRaiseNextAttackBonus(base, 20).combat?.next?.bonus).toBe(20)
    expect(knRaiseNextAttackBonus(knAddNextAttack(fight(), { bonus: 30 }), 20).combat?.next?.bonus).toBe(30)
    expect(knRaiseNextAttackBonus(fight(), 20).combat?.next?.bonus).toBe(20)
  })
})

describe('effets sur une créature', () => {
  it('l\'Armure retirée s\'ajoute par localisation et se déduit de l\'Armure de la fiche', () => {
    let run = knLoseCreatureArmor(fight(), 1, 'chest', 1)
    run = knLoseCreatureArmor(run, 1, 'chest', 1)
    run = knLoseCreatureArmor(run, 1, 'head', 99)
    const loss = run.combat?.creatures[1]?.armorLoss

    expect(loss).toEqual({ chest: 2, head: 99 })
    expect(run.combat?.creatures[0]?.armorLoss).toBeUndefined()
    expect(knArmorAfterLoss(3, loss, 'chest')).toBe(1)
    expect(knArmorAfterLoss(3, loss, 'head')).toBe(0)
    expect(knArmorAfterLoss(3, loss, 'leg')).toBe(3)
  })

  it('le malus de défense se pose puis se retire', () => {
    const run = knSetCreatureDefenseMalus(fight(), 0, 20)

    expect(run.combat?.creatures[0]?.defenseMalus).toBe(20)
    expect(knSetCreatureDefenseMalus(run, 0, 0).combat?.creatures[0]).not.toHaveProperty('defenseMalus')
  })

  it('l\'Avantage s\'annule contre un Désavantage déjà là', () => {
    expect([knWithAdvantage('normal'), knWithAdvantage('advantage'), knWithAdvantage('disadvantage'), knWithAdvantage('both')])
      .toEqual(['advantage', 'advantage', 'both', 'both'])
  })
})

describe('mouvement défensif d\'une créature', () => {
  it('chaque résultat du D10 est lu : effet d\'une seule attaque de la créature, sur le survivant, sur elle, ou texte', () => {
    expect(knMonsterMove(1)).toMatchObject({ kind: 'creatureBuff', buff: { combatSkill: 10, once: true } })
    expect(knMonsterMove(2)).toEqual({ kind: 'survivorArmorLoss', points: 1 })
    expect(knMonsterMove(3)).toEqual({ kind: 'survivorCondition', key: 'bleeding', value: 1 })
    expect(knMonsterMove(4)).toEqual({ kind: 'text' })
    expect(knMonsterMove(5)).toEqual({ kind: 'survivorPiercing', amount: 1 })
    expect(knMonsterMove(6)).toMatchObject({ kind: 'creatureBuff', buff: { damageBonus: d(1, 6), once: true } })
    expect(knMonsterMove(7)).toMatchObject({ kind: 'creatureBuff', buff: { advantage: 'attack', once: true } })
    expect(knMonsterMove(8)).toEqual({ kind: 'survivorDefense', amount: -20 })
    expect(knMonsterMove(9)).toEqual({ kind: 'creatureHeal', dice: d(1, 4) })
    expect(knMonsterMove(10)).toEqual({ kind: 'text' })
  })

  it('les libellés des effets de créature tiennent dans le schéma', () => {
    for (const roll of [1, 6, 7]) {
      const move = knMonsterMove(roll)
      expect(move.kind === 'creatureBuff' && knCreatureBuffSchema.safeParse(move.buff).success).toBe(true)
    }
  })
})

describe('état du survivant', () => {
  it('l\'Armure perdue s\'additionne par zone', () => {
    let run = knLoseSurvivorArmor(fight(), 'torso', 1)
    run = knLoseSurvivorArmor(run, 'torso', 1)

    expect(run.combat?.armorLoss).toEqual({ torso: 2 })
    expect(knArmorAfterLoss(3, run.combat?.armorLoss, 'torso')).toBe(1)
    expect(knLoseSurvivorArmor(emptyKnRun(), 'head', 1)).toEqual(emptyKnRun())
  })

  it('un malus défensif s\'ajoute au précédent sans effacer l\'impossibilité de se défendre', () => {
    const base = knSetCombatDefense(fight(), { bonus: -20, none: true })
    const run = knAddDefenseBonus(base, -20)

    expect(run.combat).toMatchObject({ defenseBonus: -40, noDefense: true })
    expect(knAddDefenseBonus(run, 40).combat).not.toHaveProperty('defenseBonus')
  })
})
