import { describe, it, expect } from 'vitest'
import {
  knActionDamageDue,
  knActionIsTest,
  knActionPool,
  knBuffedTarget,
  knBuffTotals,
  knSelfAmount,
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
import { knAdvanceCombatEffects, knClearCombatEffects } from '../../shared/ker-nethalas/combatEffects'
import { knCombatWon, knCreatureDefeated, knReactionPenalty } from '../../shared/ker-nethalas/combatState'
import {
  emptyKnRun,
  knCombatLog,
  knAddCombatCreatures,
  knAddCreatureBuff,
  knAddMinion,
  knConsumeCreatureEffects,
  knDamageCombatCreature,
  knExpireCreatureTurnEffects,
  knDamageMinion,
  knEndCombat,
  knHealMinions,
  knRemoveMinion,
  knExpireCombatTemporary,
  knGainCombatTemporary,
  knNextCombatRound,
  knRegisterReaction,
  knRunSchema,
  knSetCombatFirst,
  knSetCombatSurprise,
  knStartCombat,
} from '../../shared/ker-nethalas/run'
import { knParseDicePool } from '../../shared/ker-nethalas/dice'
import { knD100Check } from '../../shared/ker-nethalas/roll'
import { knApplyDamage, knApplyTableEffects, type KnTableEffectState } from '../../shared/ker-nethalas/tables'
import { emptyKnStatus } from '../../shared/ker-nethalas/status'
import { knSetTemporary, knTemporaryOf } from '../../shared/ker-nethalas/vitals'
import { knCreatureSelfEffectSchema } from '../../shared/ker-nethalas/creatures'
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

  it('des dégâts directs atteignent la Santé sans entamer la Robustesse', () => {
    const status = knSetTemporary(emptyKnStatus(), 'toughness', 2)
    const next = knApplyDamage({ toughness: 3, health: 10, status }, maxima, 4, true)

    expect(next).toMatchObject({ toughness: 3, health: 6 })
    expect(knTemporaryOf(next.status, 'toughness')).toBe(2)
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

describe('dégâts d\'une action de créature', () => {
  const d = (count: number, sides: number, bonus = 0) => ({ count, sides, bonus })
  const damage = (extra: object = {}) => ({ dice: d(1, 6), type: 'piercing' as const, ...extra })
  const sequence = (...values: number[]) => {
    let i = 0
    return () => values[i++ % values.length]!
  }
  const state = (): KnTableEffectState => ({
    coins: 0,
    xp: 0,
    provisions: { rations: 0, bandages: 0, craftingSupplies: 0, cookingIngredients: 0, lampOil: 0, lockpicks: 0, torches: 0, attunementCrystals: 0, ritualComponents: 0 },
    health: 12,
    toughness: 10,
    sanity: 10,
    aether: 10,
    exhaustion: 0,
    status: emptyKnStatus(),
    run: emptyKnRun(),
  })
  const maxima = { health: 12, toughness: 10, sanity: 10, aether: 10 }

  it('une action Magique, ou sans étiquette mais avec des dégâts, se joue sur un test du survivant', () => {
    expect(knActionIsTest({ tag: 'magical' })).toBe(true)
    expect(knActionIsTest({ damage: damage() })).toBe(true)
    expect(knActionIsTest({})).toBe(false)
    expect(knActionIsTest({ tag: 'physical', damage: damage() })).toBe(false)
  })

  it('les dégâts sont dus à la touche, à l\'échec du test, ou toujours', () => {
    expect(knActionDamageDue({ tag: 'physical', damage: damage() }, { hit: true })).toBe(true)
    expect(knActionDamageDue({ tag: 'physical', damage: damage() }, { hit: false })).toBe(false)
    expect(knActionDamageDue({ tag: 'magical', damage: damage() }, { testFailed: false })).toBe(false)
    expect(knActionDamageDue({ tag: 'magical', damage: damage() }, { testFailed: true })).toBe(true)
    expect(knActionDamageDue({ tag: 'magical', damage: damage({ always: true }) }, { testFailed: false })).toBe(true)
    expect(knActionDamageDue({ tag: 'magical' }, { testFailed: true })).toBe(false)
  })

  it('les dés en plus rejoignent la réserve', () => {
    const action = { min: 1, max: 6, name: 'Nova', damage: damage({ extra: [d(1, 4)] }), text: 't' }

    expect(knActionPool(action, fakeCreature(), 1)).toEqual([d(1, 6), d(1, 4)])
  })

  it('un adversaire retient le dé le plus haut, pas la somme', () => {
    const effects = [{ kind: 'damage' as const, dice: d(2, 8, 1) }]
    const foe = knApplyTableEffects(effects, state(), maxima, sequence(0, 0.6), { creature: true })
    const trap = knApplyTableEffects(effects, state(), maxima, sequence(0, 0.6))

    expect(foe.outcomes[0]!.roll.total).toBe(6)
    expect(trap.outcomes[0]!.roll.total).toBe(7)
  })

  it('la moitié des dégâts s\'arrondit au supérieur', () => {
    const half = knApplyTableEffects([{ kind: 'damage', dice: d(1, 6), half: true }], state(), maxima, () => 0.99, { creature: true })

    expect(half.outcomes[0]!.roll.total).toBe(3)
    expect(half.state.toughness).toBe(7)
  })

  it('des dégâts directs d\'un effet laissent la Robustesse intacte', () => {
    const next = knApplyTableEffects([{ kind: 'damage', dice: d(0, 0, 2), direct: true }], state(), maxima).state

    expect(next).toMatchObject({ health: 10, toughness: 10 })
  })
})

describe('soins et Santé temporaire d\'une créature', () => {
  const foes = () => knStartCombat(emptyKnRun(), [{ name: 'A', health: 8, maxHealth: 10 }, { name: 'B', health: 6, maxHealth: 6 }])
  const context = { damage: 5, health: 8, maxHealth: 10 }

  it('un montant est un jet de dés, ou une part arrondie au supérieur', () => {
    expect(knSelfAmount({ ratio: 0.5, of: 'damage' }, context)).toBe(3)
    expect(knSelfAmount({ ratio: 0.5, of: 'maxHealth' }, context)).toBe(5)
    expect(knSelfAmount({ ratio: 1, of: 'health' }, context)).toBe(8)
    expect(knSelfAmount({ dice: { count: 2, sides: 4, bonus: 1 } }, context, () => 0.99)).toBe(9)
  })

  it('la Santé temporaire s\'ajoute, sans dépasser un plafond en multiple de la Santé', () => {
    const run = knGainCombatTemporary(foes(), 0, 6, { cap: 2 })
    const more = knGainCombatTemporary(run, 0, 6, { cap: 2 })

    expect(run.combat!.creatures[0]).toMatchObject({ health: 8, temporary: 6 })
    expect(more.combat!.creatures[0]!.temporary).toBe(8)
    expect(knGainCombatTemporary(foes(), 0, 3).combat!.creatures[0]!.temporary).toBe(3)
    expect(knGainCombatTemporary(foes(), 0, 0)).toEqual(foes())
  })

  it('les dégâts retirent d\'abord la Santé temporaire, qui ne revient pas avec un soin', () => {
    const run = knGainCombatTemporary(foes(), 0, 4)
    const hit = knDamageCombatCreature(run, 0, 6)
    const healed = knDamageCombatCreature(run, 0, -5)

    expect(hit.combat!.creatures[0]).toMatchObject({ health: 6 })
    expect(hit.combat!.creatures[0]).not.toHaveProperty('temporary')
    expect(healed.combat!.creatures[0]).toMatchObject({ health: 10, temporary: 4 })
  })

  it('elle disparaît à son terme : au prochain tour de la créature, ou à la fin du round', () => {
    const turn = knGainCombatTemporary(foes(), 0, 4, { until: 'turn' })
    const round = knGainCombatTemporary(foes(), 1, 4, { until: 'round' })
    const both = knGainCombatTemporary(turn, 1, 4, { until: 'round' })

    expect(knExpireCombatTemporary(both, 'turn', 0).combat!.creatures.map(c => c.temporary)).toEqual([undefined, 4])
    expect(knExpireCombatTemporary(both, 'turn', 1).combat!.creatures.map(c => c.temporary)).toEqual([4, 4])
    expect(knNextCombatRound(both).combat!.creatures.map(c => c.temporary)).toEqual([4, undefined])
    expect(knExpireCombatTemporary(round, 'round').combat!.creatures[1]).not.toHaveProperty('temporary')
  })

  it('un effet d\'action accepte un montant en dés ou en part', () => {
    expect(knCreatureSelfEffectSchema.safeParse({ kind: 'heal', amount: { ratio: 0.5, of: 'damage' } }).success).toBe(true)
    expect(knCreatureSelfEffectSchema.safeParse({ kind: 'temporary', amount: { dice: { count: 2, sides: 4, bonus: 0 } }, cap: 2, until: 'turn' }).success).toBe(true)
    expect(knCreatureSelfEffectSchema.safeParse({ kind: 'heal', amount: { ratio: 2, of: 'damage' } }).success).toBe(false)
    expect(knCreatureSelfEffectSchema.safeParse({ kind: 'temporary', amount: { ratio: 0.5, of: 'moi' } }).success).toBe(false)
  })
})

describe('effets de combat sur le survivant', () => {
  const d = (count: number, sides: number, bonus = 0) => ({ count, sides, bonus })
  const state = (status = emptyKnStatus()): KnTableEffectState => ({
    coins: 0,
    xp: 0,
    provisions: { rations: 0, bandages: 0, craftingSupplies: 0, cookingIngredients: 0, lampOil: 0, lockpicks: 0, torches: 0, attunementCrystals: 0, ritualComponents: 0 },
    health: 12,
    toughness: 10,
    sanity: 10,
    aether: 10,
    exhaustion: 0,
    status,
    run: emptyKnRun(),
  })
  const maxima = { health: 12, toughness: 10, sanity: 10, aether: 10 }
  const aura = { kind: 'timed' as const, label: 'Aura', rounds: d(0, 0, 2), tick: { dice: d(0, 0, 3) } }

  it('un effet posé devient un modificateur de combat avec ses rounds', () => {
    const next = knApplyTableEffects([aura, { kind: 'timed', label: 'Faiblesse', rounds: d(1, 4), entries: [{ kind: 'disadvantage', target: 'allSkills' }] }], state(), maxima, () => 0.99)

    expect(next.state.status.custom).toEqual([
      { id: 'combat:Aura', name: 'Aura', active: true, entries: [], combat: true, rounds: 2, tick: { dice: d(0, 0, 3) } },
      { id: 'combat:Faiblesse', name: 'Faiblesse', active: true, entries: [{ kind: 'disadvantage', target: 'allSkills' }], combat: true, rounds: 4 },
    ])
    expect(next.outcomes.map(o => o.roll.total)).toEqual([2, 4])
  })

  it('reposer le même effet en remplace la durée au lieu de le cumuler', () => {
    const once = knApplyTableEffects([aura], state(), maxima).state
    const twice = knApplyTableEffects([{ ...aura, rounds: d(0, 0, 5) }], once, maxima).state

    expect(twice.status.custom).toHaveLength(1)
    expect(twice.status.custom[0]!.rounds).toBe(5)
  })

  it('un effet sans durée reste jusqu\'à la fin du combat', () => {
    const next = knApplyTableEffects([{ kind: 'timed', label: 'Étreinte', tick: { dice: d(0, 0, 1) } }], state(), maxima).state

    expect(next.status.custom[0]).not.toHaveProperty('rounds')
  })

  it('un round qui passe inflige les dégâts de début de tour, puis retire un round', () => {
    const status = knApplyTableEffects([aura], state(), maxima).state.status
    const first = knAdvanceCombatEffects(status)
    const second = knAdvanceCombatEffects(first.status)

    expect(first.ticks).toEqual([{ name: 'Aura', direct: false, roll: 3 }])
    expect(first.status.custom[0]!.rounds).toBe(1)
    expect(second.ticks).toHaveLength(1)
    expect(second.expired).toEqual(['Aura'])
    expect(second.status.custom).toEqual([])
  })

  it('un effet inactif ou étranger au combat ne bouge pas, et l\'état inchangé est rendu tel quel', () => {
    const own = { id: 'mien', name: 'Mien', active: true, entries: [] }
    const paused = { ...own, id: 'c:p', name: 'Pause', combat: true, active: false, rounds: 2, tick: { dice: d(0, 0, 1) } }
    const status = { ...emptyKnStatus(), custom: [own, paused] }
    const next = knAdvanceCombatEffects(status)

    expect(next.status).toBe(status)
    expect(next.ticks).toEqual([])
  })

  it('un adversaire retient le dé le plus haut pour ses dégâts de début de tour', () => {
    const status = { ...emptyKnStatus(), custom: [{ id: 'c:a', name: 'A', active: true, entries: [], combat: true, tick: { dice: d(2, 6, 1) } }] }
    let calls = 0
    const next = knAdvanceCombatEffects(status, () => [0, 0.99][calls++ % 2]!)

    expect(next.ticks[0]!.roll).toBe(7)
  })

  it('la fin du combat retire les effets de ses créatures et garde les modificateurs du joueur', () => {
    const own = { id: 'mien', name: 'Mien', active: true, entries: [] }
    const status = knApplyTableEffects([aura], state({ ...emptyKnStatus(), custom: [own] }), maxima).state.status

    expect(knClearCombatEffects(status).custom).toEqual([own])
    expect(knClearCombatEffects(emptyKnStatus())).toEqual(emptyKnStatus())
  })
})

describe('effets en cours sur une créature', () => {
  const d = (count: number, sides: number, bonus = 0) => ({ count, sides, bonus })
  const roll = (pool: number, damageType: KnDamageInput['damageType'], target: KnDamageInput['target'], magical = false) =>
    knResolveDamage({ roll: { dice: [], bonus: 0, picked: pool, total: pool }, damageType, criticalStrike: false, weakSpot: false, armor: 0, target, magical })
  const base = { vulnerable: [], resistant: [], restored: [] } as const
  const foes = () => knStartCombat(emptyKnRun(), [
    { ref: 'rat', name: 'Rat 1', health: 5, maxHealth: 5 },
    { ref: 'rat', name: 'Rat 2', health: 5, maxHealth: 5 },
    { ref: 'rat', name: 'Rat 3', health: 0, maxHealth: 5 },
    { ref: 'owl', name: 'Hibou', health: 5, maxHealth: 5 },
  ])

  it('Résistant à tout divise les dégâts par deux, sauf pour les types exclus', () => {
    const target = knBuffedTarget(base, [{ label: 'Voile', resistantAll: true, resistantExcept: ['holy'] }])

    expect(roll(5, 'fire', target).damage).toBe(3)
    expect(roll(5, 'holy', target).damage).toBe(5)
  })

  it('Immunisé annule les dégâts, y compris tous les dégâts non magiques', () => {
    const fire = knBuffedTarget(base, [{ label: 'Forme', immune: ['fire'] }])
    const ghost = knBuffedTarget(base, [{ label: 'Spectre', immuneNonMagical: true }])

    expect(roll(5, 'fire', fire).damage).toBe(0)
    expect(roll(5, 'cold', fire).damage).toBe(5)
    expect(roll(5, 'slashing', ghost).damage).toBe(0)
    expect(roll(5, 'arcane', ghost, true).damage).toBe(5)
  })

  it('Vulnérable à tout double les dégâts, et annule un Résistant à tout', () => {
    expect(roll(4, 'fire', knBuffedTarget(base, [{ label: 'Frénésie', vulnerableAll: true }])).damage).toBe(8)
    expect(roll(4, 'fire', knBuffedTarget(base, [{ label: 'a', vulnerableAll: true }, { label: 'b', resistantAll: true }])).damage).toBe(4)
  })

  it('les bonus, avantages et ripostes de plusieurs effets se cumulent', () => {
    const totals = knBuffTotals([
      { label: 'A', combatSkill: 5, defenseSkill: 10, advantage: 'attack', damageBonus: d(1, 6) },
      { label: 'B', combatSkill: 10, disadvantageAgainst: true, reflect: { dice: d(0, 0, 2), type: 'lightning' } },
    ])

    expect(totals).toMatchObject({ attackBonus: 15, defenseBonus: 25, attackAdvantage: true, defenseAdvantage: false, disadvantageAgainst: true })
    expect(totals.damageBonuses).toEqual([d(1, 6)])
    expect(totals.reflect).toEqual([{ dice: d(0, 0, 2), type: 'lightning', label: 'B' }])
    expect(knBuffTotals(undefined)).toMatchObject({ attackBonus: 0, defenseBonus: 0, damageBonuses: [], reflect: [] })
  })

  it('un effet se pose sur une créature, ou sur toutes les vivantes de sa fiche, et se remplace plutôt que de se cumuler', () => {
    const one = knAddCreatureBuff(foes(), 0, { label: 'Cri', combatSkill: 10 })
    const sheet = knAddCreatureBuff(foes(), 0, { label: 'Cri', combatSkill: 10 }, 'sameSheet')
    const again = knAddCreatureBuff(sheet, 0, { label: 'Cri', combatSkill: 20 }, 'sameSheet')

    expect(one.combat!.creatures.map(c => c.effects?.length ?? 0)).toEqual([1, 0, 0, 0])
    expect(sheet.combat!.creatures.map(c => c.effects?.length ?? 0)).toEqual([1, 1, 0, 0])
    expect(again.combat!.creatures[1]!.effects).toEqual([{ label: 'Cri', combatSkill: 20 }])
  })

  it('un round qui passe retire un round aux effets à durée, et ceux sans durée restent', () => {
    let run = knAddCreatureBuff(foes(), 0, { label: 'Court', rounds: 1 })
    run = knAddCreatureBuff(run, 0, { label: 'Long', rounds: 2 })
    run = knAddCreatureBuff(run, 0, { label: 'Toujours' })
    const next = knNextCombatRound(run)
    const last = knNextCombatRound(next)

    expect(next.combat!.creatures[0]!.effects!.map(e => [e.label, e.rounds])).toEqual([['Long', 1], ['Toujours', undefined]])
    expect(last.combat!.creatures[0]!.effects!.map(e => e.label)).toEqual(['Toujours'])
    expect(knNextCombatRound(foes()).combat!.creatures[0]).not.toHaveProperty('effects')
  })

  it('le tour de la créature retire ses effets « jusqu\'à son prochain tour », pas ceux d\'une autre', () => {
    let run = knAddCreatureBuff(foes(), 0, { label: 'Voile', untilTurn: true })
    run = knAddCreatureBuff(run, 3, { label: 'Voile', untilTurn: true })
    const next = knExpireCreatureTurnEffects(run, 0)

    expect(next.combat!.creatures[0]).not.toHaveProperty('effects')
    expect(next.combat!.creatures[3]!.effects).toHaveLength(1)
  })

  it('un effet à usage unique tombe une fois utilisé', () => {
    let run = knAddCreatureBuff(foes(), 0, { label: 'Infusion', once: true })
    run = knAddCreatureBuff(run, 0, { label: 'Durable', rounds: 3 })
    const next = knConsumeCreatureEffects(run, 0)

    expect(next.combat!.creatures[0]!.effects!.map(e => e.label)).toEqual(['Durable'])
  })

  it('une action peut poser un effet sur la créature, avec une durée en dés', () => {
    const buff = { kind: 'buff', label: 'Cri', scope: 'sameSheet', rounds: d(1, 4), combatSkill: 10 }

    expect(knCreatureSelfEffectSchema.safeParse(buff).success).toBe(true)
    expect(knCreatureSelfEffectSchema.safeParse({ ...buff, advantage: 'toujours' }).success).toBe(false)
    expect(knCreatureSelfEffectSchema.safeParse({ ...buff, scope: 'tous' }).success).toBe(false)
  })
})

describe('sbires et adversaires invoqués', () => {
  const skeleton = { ref: 'skeleton', name: 'Sbire', health: 4, maxHealth: 4 }
  const foes = () => knStartCombat(emptyKnRun(), [{ ref: 'imp', name: 'Démon 1', health: 2, maxHealth: 2 }])

  it('un sbire rejoint l\'équipe, dans la limite de six', () => {
    const run = knAddMinion(emptyKnRun(), skeleton)
    const full = Array.from({ length: 7 }, () => skeleton).reduce(knAddMinion, emptyKnRun())

    expect(run.minions).toEqual([skeleton])
    expect(full.minions).toHaveLength(6)
    expect(knRunSchema.safeParse(run).success).toBe(true)
  })

  it('un sbire qui tombe à 0 Santé est détruit, un autre est seulement blessé', () => {
    const run = knAddMinion(knAddMinion(emptyKnRun(), skeleton), { ...skeleton, name: 'Sbire 2' })
    const hurt = knDamageMinion(run, 1, 3)
    const dead = knDamageMinion(run, 0, 9)

    expect(hurt.destroyed).toBe(false)
    expect(hurt.run.minions![1]!.health).toBe(1)
    expect(dead.destroyed).toBe(true)
    expect(dead.run.minions!.map(m => m.name)).toEqual(['Sbire 2'])
    expect(knDamageMinion(emptyKnRun(), 0, 3)).toEqual({ run: emptyKnRun(), destroyed: false })
  })

  it('retirer le dernier sbire retire la liste, et une pièce nettoyée les soigne tous', () => {
    const run = knAddMinion(emptyKnRun(), { ...skeleton, health: 1, temporary: 3 })
    const healed = knHealMinions(run)

    expect(healed.minions![0]).toEqual(skeleton)
    expect(knRemoveMinion(run, 0)).not.toHaveProperty('minions')
    expect(knHealMinions(emptyKnRun())).toEqual(emptyKnRun())
  })

  it('les sbires survivent à la fin du combat', () => {
    const run = knStartCombat(knAddMinion(emptyKnRun(), skeleton), [{ name: 'A', health: 1, maxHealth: 1 }])

    expect(knEndCombat(run).minions).toEqual([skeleton])
  })

  it('des adversaires invoqués rejoignent le combat sans dépasser le maximum de leur fiche', () => {
    const imps = (count: number) => Array.from({ length: count }, (_, i) => ({ ref: 'imp', name: `Démon ${i + 2}`, health: 2, maxHealth: 2 }))

    expect(knAddCombatCreatures(foes(), imps(2)).combat!.creatures).toHaveLength(3)
    expect(knAddCombatCreatures(foes(), imps(5), 4).combat!.creatures).toHaveLength(4)
    expect(knAddCombatCreatures(knAddCombatCreatures(foes(), imps(3), 4), imps(2), 4).combat!.creatures).toHaveLength(4)
    expect(knAddCombatCreatures(emptyKnRun(), imps(1))).toEqual(emptyKnRun())
  })

  it('une fiche peut ajouter des types qui la restaurent, et une action invoquer des adversaires', () => {
    const demon = fakeCreature({ types: ['demon'], restored: ['fire'] })

    expect(knCreatureDamageTarget(demon).restored).toEqual(['infernal', 'fire'])
    expect(knCreatureSelfEffectSchema.safeParse({ kind: 'summon', ref: 'lesserDemon', count: { count: 1, sides: 4, bonus: 0 }, max: 4 }).success).toBe(true)
    expect(knCreatureSelfEffectSchema.safeParse({ kind: 'summon', ref: 'Pas une clé', count: { count: 1, sides: 4, bonus: 0 } }).success).toBe(false)
  })
})
