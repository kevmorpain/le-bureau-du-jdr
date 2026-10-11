import { describe, it, expect } from 'vitest'
import {
  knActionPool,
  knCombatExchange,
  knCreatureDamageTarget,
  knOpposedCheck,
  knPackBonus,
  knPenetrating,
  knResolveDamage,
  knRollDamagePool,
  knSurvivorArmorZone,
  knWithDisadvantage,
  type KnDamageInput,
} from '../../shared/ker-nethalas/combat'
import { knCombatWon, knCreatureDefeated, knReactionPenalty } from '../../shared/ker-nethalas/combatState'
import {
  emptyKnRun,
  knCombatLog,
  knDamageCombatCreature,
  knEndCombat,
  knNextCombatRound,
  knRegisterReaction,
  knRunSchema,
  knSetCombatFirst,
  knSetCombatSurprise,
  knStartCombat,
} from '../../shared/ker-nethalas/run'
import { knParseDicePool } from '../../shared/ker-nethalas/dice'
import { knD100Check } from '../../shared/ker-nethalas/roll'
import { knApplyDamage } from '../../shared/ker-nethalas/tables'
import { emptyKnStatus } from '../../shared/ker-nethalas/status'
import { knSetTemporary, knTemporaryOf } from '../../shared/ker-nethalas/vitals'
import { fakeCreature } from '../fixtures/knCreatures'

const check = (roll: number, score: number) => knD100Check({ roll, score, difficulty: 0, mode: 'normal' })
const rng = () => 0.5

describe('jet opposé d\'un échange de combat', () => {
  it('entre deux succès, le jet le plus haut gagne', () => {
    expect(knCombatExchange(check(40, 60), check(30, 60)).outcome).toBe('hit')
    expect(knCombatExchange(check(30, 60), check(40, 60)).outcome).toBe('defended')
  })

  it('à jets égaux, la compétence la plus haute gagne ; à tout égal, on relance', () => {
    expect(knCombatExchange(check(40, 70), check(40, 60)).outcome).toBe('hit')
    expect(knCombatExchange(check(40, 60), check(40, 70)).outcome).toBe('defended')
    expect(knCombatExchange(check(40, 60), check(40, 60)).outcome).toBe('reroll')
  })

  it('un succès bat un échec, quels que soient les jets', () => {
    expect(knCombatExchange(check(10, 60), check(90, 60)).outcome).toBe('hit')
    expect(knCombatExchange(check(90, 60), check(10, 60)).outcome).toBe('defended')
  })

  it('si les deux échouent, le défenseur subit 1 dégât', () => {
    expect(knCombatExchange(check(80, 60), check(90, 60)).outcome).toBe('bothFail')
  })

  it('un Coup critique touche, même contre un jet plus haut, sauf défense critique', () => {
    const strike = knCombatExchange(check(22, 50), check(45, 60))

    expect(strike).toMatchObject({ outcome: 'hit', criticalStrike: true })
    expect(knCombatExchange(check(22, 50), check(33, 60)).outcome).toBe('defended')
    expect(knCombatExchange(check(33, 50), check(22, 60)).outcome).toBe('hit')
  })

  it('une défense critique l\'emporte sur un simple succès', () => {
    expect(knCombatExchange(check(50, 60), check(11, 60)).outcome).toBe('defended')
  })

  it('un échec critique de l\'attaquant le fait perdre et déclenche une maladresse', () => {
    expect(knCombatExchange(check(77, 50), check(40, 60))).toMatchObject({ outcome: 'defended', fumble: true })
    expect(knCombatExchange(check(77, 50), check(90, 60))).toMatchObject({ outcome: 'bothFail', fumble: true })
  })

  it('un échec critique du défenseur lui fait perdre', () => {
    expect(knCombatExchange(check(50, 60), check(88, 60)).outcome).toBe('hit')
  })

  it('viser un point faible donne le Désavantage, qui annule un Avantage', () => {
    expect([knWithDisadvantage('normal'), knWithDisadvantage('advantage'), knWithDisadvantage('disadvantage'), knWithDisadvantage('both')])
      .toEqual(['disadvantage', 'both', 'disadvantage', 'both'])
  })

  it('chaque défense du round après la première coûte 20 de plus', () => {
    expect([0, 1, 2, 3].map(knReactionPenalty)).toEqual([0, 20, 40, 60])
  })
})

describe('réserve de dégâts', () => {
  it('garde le dé le plus haut et ajoute tous les bonus fixes', () => {
    const roll = knRollDamagePool([{ count: 1, sides: 6, bonus: 0 }, { count: 1, sides: 4, bonus: 1 }, { count: 0, sides: 0, bonus: 2 }], rng)

    expect(roll.dice).toEqual([{ sides: 6, roll: 4 }, { sides: 4, roll: 3 }])
    expect(roll).toMatchObject({ picked: 4, bonus: 3, total: 7 })
  })

  it('« 2D8 » est une réserve de deux dés : on garde le plus haut', () => {
    expect(knRollDamagePool([{ count: 2, sides: 8, bonus: 0 }], rng).dice).toHaveLength(2)
  })

  it('un bonus fixe seul donne ce bonus', () => {
    expect(knRollDamagePool([{ count: 0, sides: 0, bonus: 2 }], rng).total).toBe(2)
  })
})

describe('dégâts, armure et types', () => {
  const roll = (total: number) => ({ dice: [], bonus: 0, picked: total, total })
  const none = { vulnerable: [], resistant: [], restored: [] }
  const input = (patch: Partial<KnDamageInput>): KnDamageInput => ({
    roll: roll(5),
    damageType: 'slashing',
    criticalStrike: false,
    weakSpot: false,
    armor: 0,
    target: none,
    ...patch,
  })

  it('l\'Armure absorbe ses points', () => {
    expect(knResolveDamage(input({ damageType: 'piercing', armor: 2 }))).toMatchObject({ armorAbsorbed: 2, damage: 3 })
  })

  it('le contondant ignore 1 point d\'Armure, le feu les ignore tous', () => {
    expect(knResolveDamage(input({ damageType: 'bludgeoning', armor: 3 })).armorAbsorbed).toBe(2)
    expect(knResolveDamage(input({ damageType: 'fire', armor: 3 })).armorAbsorbed).toBe(0)
  })

  it('Pénétrant ignore des points d\'Armure en plus', () => {
    expect(knResolveDamage(input({ damageType: 'piercing', armor: 3, armorIgnored: 2 })).armorAbsorbed).toBe(1)
  })

  it('un Coup critique double la réserve, fixes compris', () => {
    expect(knResolveDamage(input({ damageType: 'bludgeoning', criticalStrike: true })).damage).toBe(10)
  })

  it('un point faible double aussi, sans tripler avec un Coup critique', () => {
    expect(knResolveDamage(input({ damageType: 'bludgeoning', weakSpot: true })).damage).toBe(10)
    expect(knResolveDamage(input({ damageType: 'bludgeoning', weakSpot: true, criticalStrike: true })).damage).toBe(10)
  })

  it('le perforant ajoute +2 sur un Coup critique, sans le doubler', () => {
    expect(knResolveDamage(input({ damageType: 'piercing', criticalStrike: true })).damage).toBe(12)
  })

  it('le tranchant ajoute 1 sous 4 dégâts, après l\'Armure', () => {
    expect(knResolveDamage(input({ damageType: 'slashing', roll: roll(3) })).damage).toBe(4)
    expect(knResolveDamage(input({ damageType: 'slashing', roll: roll(5), armor: 2 })).damage).toBe(4)
    expect(knResolveDamage(input({ damageType: 'slashing', roll: roll(6) })).damage).toBe(6)
  })

  it('vulnérable double après l\'Armure, résistant divise par deux en arrondissant au-dessus', () => {
    expect(knResolveDamage(input({ damageType: 'holy', target: { ...none, vulnerable: ['holy'] } })).damage).toBe(10)
    expect(knResolveDamage(input({ damageType: 'holy', target: { ...none, resistant: ['holy'] } })).damage).toBe(3)
  })

  it('Vulnérable et Résistant au même type s\'annulent', () => {
    expect(knResolveDamage(input({ damageType: 'holy', target: { ...none, vulnerable: ['holy'], resistant: ['holy'] } })).damage).toBe(5)
  })

  it('Restauré soigne au lieu de blesser', () => {
    expect(knResolveDamage(input({ damageType: 'necrotic', target: { ...none, restored: ['necrotic'] } }))).toMatchObject({ damage: 0, heal: 5 })
  })

  it('Résistant aux dégâts physiques non magiques, sauf attaque magique', () => {
    const target = { ...none, resistantPhysical: true }

    expect(knResolveDamage(input({ damageType: 'slashing', roll: roll(8), target })).damage).toBe(4)
    expect(knResolveDamage(input({ damageType: 'slashing', roll: roll(8), target, magical: true })).damage).toBe(8)
    expect(knResolveDamage(input({ damageType: 'fire', roll: roll(8), target })).damage).toBe(8)
  })

  it('lit les règles d\'une créature : type, fiche et affinité d\'un Élémentaire', () => {
    expect(knCreatureDamageTarget(fakeCreature({ types: ['undead'] }))).toMatchObject({ vulnerable: ['holy'], restored: ['necrotic'] })
    expect(knCreatureDamageTarget(fakeCreature({ types: ['elemental'], affinity: 'fire', vulnerable: ['cold'] }))).toMatchObject({ vulnerable: ['cold'], restored: ['fire'] })
    expect(knCreatureDamageTarget(fakeCreature({ types: ['animal'], affinity: 'fire' })).restored).toEqual([])
  })
})

describe('créature en combat', () => {
  it('la réserve d\'une action ajoute les dés de ses paliers de niveau', () => {
    const creature = fakeCreature()
    const action = { min: 1, max: 6, name: 'Coup', damage: { dice: { count: 1, sides: 6, bonus: 0 }, type: 'piercing' as const }, text: 't' }

    expect(knActionPool(action, creature, 1)).toHaveLength(1)
    expect(knActionPool(action, creature, 11)).toHaveLength(3)
    expect(knActionPool({ min: 1, max: 6, name: 'Cri', text: 't' }, creature, 11)).toEqual([])
  })

  it('Meute : +5 par autre créature semblable en vie ; Pénétrant : sa valeur', () => {
    const pack = fakeCreature({ traits: [{ key: 'pack' }] })

    expect([knPackBonus(pack, 1), knPackBonus(pack, 3)]).toEqual([0, 10])
    expect(knPackBonus(fakeCreature(), 3)).toBe(0)
    expect(knPenetrating(fakeCreature({ traits: [{ key: 'penetrating', value: 2 }] }))).toBe(2)
    expect(knPenetrating(fakeCreature({ traits: [] }))).toBe(0)
  })

  it('le torse protège la poitrine et l\'abdomen', () => {
    expect(['head', 'chest', 'abdomen', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'].map(key => knSurvivorArmorZone(key as never)))
      .toEqual(['head', 'torso', 'torso', 'arms', 'arms', 'legs', 'legs'])
  })
})

describe('état du combat', () => {
  const foes = [{ name: 'A', health: 10, maxHealth: 10 }, { ref: 'fakeBeast', name: 'B', health: 4, maxHealth: 4 }]

  it('s\'engage une fois, au round 1', () => {
    const run = knStartCombat(emptyKnRun(), foes)

    expect(run.combat).toMatchObject({ round: 1, reactions: 0, log: [] })
    expect(knStartCombat(run, [{ name: 'C', health: 1, maxHealth: 1 }])).toBe(run)
    expect(knStartCombat(emptyKnRun(), [])).toEqual(emptyKnRun())
    expect(knRunSchema.safeParse(run).success).toBe(true)
  })

  it('les dégâts et les soins restent entre 0 et le maximum', () => {
    const run = knStartCombat(emptyKnRun(), foes)

    expect(knDamageCombatCreature(run, 0, 4).combat!.creatures[0]!.health).toBe(6)
    expect(knDamageCombatCreature(run, 0, 99).combat!.creatures[0]!.health).toBe(0)
    expect(knDamageCombatCreature(knDamageCombatCreature(run, 0, 4), 0, -99).combat!.creatures[0]!.health).toBe(10)
    expect(knDamageCombatCreature(run, 5, 4)).toBe(run)
  })

  it('victoire quand toutes les créatures sont à 0', () => {
    let run = knStartCombat(emptyKnRun(), foes)
    run = knDamageCombatCreature(knDamageCombatCreature(run, 0, 10), 1, 4)

    expect(knCreatureDefeated(run.combat!.creatures[0]!)).toBe(true)
    expect(knCombatWon(run.combat!)).toBe(true)
    expect(knCombatWon(knDamageCombatCreature(run, 1, -1).combat!)).toBe(false)
  })

  it('le round suivant remet les réactions à 0', () => {
    let run = knRegisterReaction(knRegisterReaction(knStartCombat(emptyKnRun(), foes)))

    expect(run.combat!.reactions).toBe(2)
    run = knNextCombatRound(run)
    expect(run.combat).toMatchObject({ round: 2, reactions: 0 })
  })

  it('garde l\'initiative et un journal, plus récent en tête et borné', () => {
    let run = knSetCombatFirst(knStartCombat(emptyKnRun(), foes), 'creatures')

    expect(run.combat!.first).toBe('creatures')
    for (let i = 0; i < 40; i++) run = knCombatLog(run, `ligne ${i}`)
    expect(run.combat!.log).toHaveLength(30)
    expect(run.combat!.log[0]).toBe('ligne 39')
    expect(knRunSchema.safeParse(run).success).toBe(true)
  })

  it('se termine en retirant l\'état, et sans combat rien ne change', () => {
    const run = knStartCombat(emptyKnRun(), foes)

    expect(knEndCombat(run)).not.toHaveProperty('combat')
    expect(knNextCombatRound(emptyKnRun())).toEqual(emptyKnRun())
    expect(knRegisterReaction(emptyKnRun())).toEqual(emptyKnRun())
    expect(knCombatLog(emptyKnRun(), 'x')).toEqual(emptyKnRun())
  })

  it('refuse un combat sans créature, ou une Santé hors bornes', () => {
    const run = knStartCombat(emptyKnRun(), foes)

    expect(knRunSchema.safeParse({ ...run, combat: { ...run.combat!, creatures: [] } }).success).toBe(false)
    expect(knRunSchema.safeParse({ ...run, combat: { ...run.combat!, creatures: [{ name: 'A', health: -1, maxHealth: 5 }] } }).success).toBe(false)
  })
})

describe('jet opposé hors combat', () => {
  it('un critique bat un succès, un succès bat un échec, un échec bat un échec critique', () => {
    expect(knOpposedCheck(check(22, 50), check(10, 60))).toBe('a')
    expect(knOpposedCheck(check(10, 60), check(22, 50))).toBe('b')
    expect(knOpposedCheck(check(40, 50), check(80, 50))).toBe('a')
    expect(knOpposedCheck(check(80, 50), check(77, 50))).toBe('a')
  })

  it('à rang égal, le jet le plus haut gagne, même entre deux échecs', () => {
    expect(knOpposedCheck(check(45, 50), check(30, 50))).toBe('a')
    expect(knOpposedCheck(check(95, 50), check(80, 50))).toBe('a')
    expect(knOpposedCheck(check(80, 50), check(95, 50))).toBe('b')
  })

  it('à jets égaux, la compétence la plus haute gagne, sinon on relance', () => {
    expect(knOpposedCheck(check(40, 70), check(40, 60))).toBe('a')
    expect(knOpposedCheck(check(40, 60), check(40, 60))).toBe('tie')
  })
})

describe('réserve de dégâts saisie', () => {
  it('lit des dés, des bonus fixes et des sommes', () => {
    expect(knParseDicePool('D6')).toEqual([{ count: 1, sides: 6, bonus: 0 }])
    expect(knParseDicePool('2d8 + 1')).toEqual([{ count: 2, sides: 8, bonus: 0 }, { count: 0, sides: 0, bonus: 1 }])
    expect(knParseDicePool('D6+D4+2')).toHaveLength(3)
  })

  it('refuse ce qui n\'est pas une réserve', () => {
    expect(knParseDicePool('')).toBeNull()
    expect(knParseDicePool('beaucoup')).toBeNull()
    expect(knParseDicePool('D1')).toBeNull()
    expect(knParseDicePool('30D6')).toBeNull()
  })
})

describe('dégâts subis par le survivant', () => {
  const maxima = { toughness: 20, health: 12 }

  it('retirent la Robustesse temporaire, puis la Robustesse, puis la Santé', () => {
    const status = knSetTemporary(emptyKnStatus(), 'toughness', 2)
    const next = knApplyDamage({ toughness: 3, health: 10, status }, maxima, 9)

    expect(next).toMatchObject({ toughness: 0, health: 6 })
    expect(knTemporaryOf(next.status, 'toughness')).toBe(0)
  })

  it('la Santé ne descend pas sous 0, et un état sans Robustesse temporaire reste intact', () => {
    const status = emptyKnStatus()
    const next = knApplyDamage({ toughness: 0, health: 3, status }, maxima, 50)

    expect(next.health).toBe(0)
    expect(next.status).toBe(status)
  })
})

describe('surprise et Overseer dans l\'état du combat', () => {
  const foes = [{ name: 'A', health: 5, maxHealth: 5 }]

  it('retient la surprise, puis l\'efface', () => {
    const run = knStartCombat(emptyKnRun(), foes)

    expect(knSetCombatSurprise(run, true).combat!.surprise).toBe(true)
    expect(knSetCombatSurprise(knSetCombatSurprise(run, true), false).combat).not.toHaveProperty('surprise')
    expect(knSetCombatSurprise(emptyKnRun(), true)).toEqual(emptyKnRun())
  })

  it('un combat contre l\'Overseer se reconnaît', () => {
    expect(knStartCombat(emptyKnRun(), foes, true).combat!.overseer).toBe(true)
    expect(knStartCombat(emptyKnRun(), foes).combat).not.toHaveProperty('overseer')
    expect(knRunSchema.safeParse(knStartCombat(emptyKnRun(), foes, true)).success).toBe(true)
  })
})
