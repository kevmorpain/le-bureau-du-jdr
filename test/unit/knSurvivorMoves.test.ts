import { describe, expect, it } from 'vitest'
import { knArmorAfterLoss, knWithAdvantage } from '../../shared/ker-nethalas/combat'
import {
  emptyKnRun,
  knAddNextAttack,
  knClearNextAttack,
  knLoseCreatureArmor,
  knRaiseNextAttackBonus,
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
    expect(knSurvivorMove(3)).toEqual({ kind: 'text' })
    expect(knSurvivorMove(4)).toEqual({ kind: 'text' })
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
