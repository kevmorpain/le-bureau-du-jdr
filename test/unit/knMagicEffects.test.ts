import { describe, it, expect } from 'vitest'
import { emptyKnProvisions } from '../../shared/ker-nethalas/camp'
import { knResolveDamage } from '../../shared/ker-nethalas/combat'
import { knArmorByZone, knAttackOptions, knInitiativeBonus } from '../../shared/ker-nethalas/equipment'
import type { KnItem } from '../../shared/ker-nethalas/inventory'
import type { KnMagic, KnMagicMech, KnMagicProperty } from '../../shared/ker-nethalas/magicSchema'
import {
  knIsWorn,
  knMagicArmorBonus,
  knMagicAttack,
  knMagicCarryBonus,
  knMagicDefenses,
  knMagicInitiative,
  knMagicPendingChoices,
  knMagicProvidesLight,
  knMagicSources,
  knMagicUses,
} from '../../shared/ker-nethalas/magicEffects'
import { emptyKnRun } from '../../shared/ker-nethalas/run'
import { emptyKnStatus } from '../../shared/ker-nethalas/status'
import { knApplyTableEffects, type KnTableEffectState } from '../../shared/ker-nethalas/tables'

const d = (count: number, sides: number, bonus = 0) => ({ count, sides, bonus })

const property = (mech: KnMagicMech[], over: Partial<KnMagicProperty> = {}): KnMagicProperty => ({ text: 'texte', mech, ...over })

const magic = (properties: KnMagicProperty[], identified = true): KnMagic => ({ table: 'ring', identified, rarity: 'rare', properties, peculiarities: [] })

const item = (id: string, kind: KnItem['kind'], place: KnItem['place'], over: Partial<KnItem> = {}): KnItem =>
  ({ id, name: `objet ${id}`, kind, weight: 'light', quantity: 1, place, ...over })

describe('objets magiques portés', () => {
  it('seul ce qu\'on porte ou tient agit, et seulement une fois harmonisé', () => {
    const mech: KnMagicMech[] = [{ k: 'modifier', targets: ['endurance'], amount: 10 }]
    const worn = item('i1', 'ring', 'ring', { magic: magic([property(mech)]) })
    const bag = item('i2', 'ring', 'bag', { magic: magic([property(mech)]) })
    const belt = item('i3', 'ring', 'quick', { magic: magic([property(mech)]) })
    const unknown = item('i4', 'ring', 'ring', { magic: magic([property(mech)], false) })

    expect(knIsWorn(worn)).toBe(true)
    expect(knMagicSources([worn, bag, belt, unknown])).toEqual([
      { id: 'magic:i1', label: { text: 'objet i1' }, effects: [{ type: 'modifier', targets: ['endurance'], amount: 10 }], reminders: [] },
    ])
  })

  it('modificateurs, Avantages et jauges deviennent des effets de la fiche', () => {
    const ring = item('i1', 'ring', 'ring', {
      magic: magic([
        property([{ k: 'advantage', targets: ['stealth'] }]),
        property([{ k: 'maxVital', vital: 'aether', amount: 7 }]),
        property([{ k: 'maxVital', vital: 'toughness', amount: -5 }]),
      ]),
    })

    expect(knMagicSources([ring])[0]!.effects).toEqual([
      { type: 'advantage', targets: ['stealth'] },
      { type: 'maxVitalDelta', vital: 'aether', amount: 7 },
      { type: 'maxVitalDelta', vital: 'toughness', amount: -5 },
    ])
  })

  it('une propriété sans mécanique est un rappel ; une propriété à bouton n\'en est pas un', () => {
    const ring = item('i1', 'ring', 'ring', {
      magic: magic([
        property([], { text: 'Relancez un test de Larcin.' }),
        property([{ k: 'use', limit: 'rest', label: 'Soigner' }], { text: 'Une fois par repos.' }),
      ]),
    })

    expect(knMagicSources([ring])[0]).toMatchObject({ effects: [], reminders: [{ label: { text: 'objet i1 : Relancez un test de Larcin.' }, severity: 'info' }] })
  })

  it('une compétence à choisir n\'agit qu\'une fois choisie', () => {
    const chosen = property([{ k: 'modifier', targets: [], amount: 20 }], { choose: 'skill', choice: 'stealth' })
    const open = property([{ k: 'modifier', targets: [], amount: 20 }], { choose: 'skill' })

    expect(knMagicSources([item('i1', 'belt', 'belt', { magic: magic([chosen]) })])[0]!.effects).toEqual([{ type: 'modifier', targets: ['stealth'], amount: 20 }])
    expect(knMagicSources([item('i2', 'belt', 'belt', { magic: magic([open]) })])).toEqual([])
    expect(knMagicPendingChoices(item('i2', 'belt', 'belt', { magic: magic([open, chosen]) }))).toEqual([0])
  })

  it('portage, lumière, Initiative et Armure des vambraces et des jambières', () => {
    const items = [
      item('i1', 'belt', 'belt', { magic: magic([property([{ k: 'carry', amount: 10 }]), property([{ k: 'light' }])]) }),
      item('i2', 'ring', 'ring', { magic: magic([property([{ k: 'initiative', amount: 10 }])]) }),
      item('i3', 'gloves', 'gloves', { magic: magic([property([{ k: 'armor', piece: 'vambraces', amount: 1 }])]) }),
      item('i4', 'vambraces', 'armor', { protection: 2 }),
    ]

    expect(knMagicCarryBonus(items)).toBe(10)
    expect(knMagicProvidesLight(items)).toBe(true)
    expect(knMagicInitiative(items)).toBe(10)
    expect(knInitiativeBonus(items)).toBe(10)
    expect(knMagicArmorBonus(items, 'vambraces')).toBe(1)
    expect(knArmorByZone(items)).toEqual({ head: 0, torso: 0, arms: 3, legs: 0 })
    expect(knArmorByZone(items.filter(entry => entry.id !== 'i4')).arms).toBe(0)
  })

  it('Résistances, immunités et réductions se cumulent comme le livre le laisse penser : une Résistance par type, des réductions qui s\'additionnent', () => {
    const items = [
      item('i1', 'belt', 'belt', { magic: magic([property([{ k: 'resist', damage: 'fire' }]), property([{ k: 'reduce', damage: 'fire', amount: 1 }])]) }),
      item('i2', 'boots', 'boots', { magic: magic([property([{ k: 'resist', damage: 'fire' }, { k: 'immune', condition: 'stunned' }]), property([{ k: 'reduce', damage: 'fire', amount: 2 }])]) }),
    ]

    expect(knMagicDefenses(items)).toEqual({ resistant: ['fire'], reduction: { fire: 3 }, immune: ['stunned'] })
  })

  it('les usages limités ont une clé par objet et par rang de propriété', () => {
    const ring = item('i7', 'ring', 'ring', {
      magic: magic([property([]), property([{ k: 'use', limit: 'rest', label: 'Soigner D10', heal: d(1, 10), self: true }])]),
    })

    expect(knMagicUses([ring])).toEqual([{ key: 'i7:2', itemId: 'i7', itemName: 'objet i7', label: 'Soigner D10', limit: 'rest', heal: d(1, 10), self: true }])
    expect(knMagicUses([{ ...ring, place: 'bag' }])).toEqual([])
  })
})

describe('attaque avec des objets magiques', () => {
  const sword = item('i1', 'weapon', 'mainHand', {
    weapon: { skill: 'bladedWeapons', speed: 2, damageType: 'slashing', traits: [] },
    magic: magic([
      property([{ k: 'damage', dice: d(1, 4), type: 'fire' }]),
      property([{ k: 'damage', dice: d(0, 0, 1) }]),
      property([{ k: 'speed', amount: 10 }]),
      property([{ k: 'damageVs', enemy: 'undead', amount: 2 }]),
    ]),
  })
  const other = item('i2', 'weapon', 'offHand', {
    weapon: { skill: 'bladedWeapons', speed: 0, damageType: 'piercing', traits: [] },
    magic: magic([property([{ k: 'damage', dice: d(1, 6) }])]),
  })
  const gloves = item('i3', 'gloves', 'gloves', { magic: magic([property([{ k: 'damage', dice: d(0, 0, 1) }])]) })

  it('une arme garde ses propres bonus, et ne profite pas de ceux d\'une autre', () => {
    expect(knMagicAttack([sword, other], 'i1')).toEqual({
      dice: [{ dice: d(1, 4), type: 'fire' }, { dice: d(0, 0, 1) }],
      speed: 10,
      vs: [{ enemy: 'undead', amount: 2 }],
    })
    expect(knMagicAttack([sword, other], 'i2').dice).toEqual([{ dice: d(1, 6) }])
  })

  it('des gants qui ajoutent +1 dégât valent pour toute arme, pas pour les mains nues', () => {
    expect(knMagicAttack([other, gloves], 'i2').dice).toEqual([{ dice: d(1, 6) }, { dice: d(0, 0, 1) }])
    expect(knMagicAttack([gloves], null).dice).toEqual([])
  })

  it('la réserve proposée reprend les dés, et la Vitesse l\'ajout magique', () => {
    const [option] = knAttackOptions([sword])

    expect(option).toMatchObject({ weapon: 'objet i1', pool: 'D6+D4+1', speed: 12 })
    expect(option!.magic?.vs).toEqual([{ enemy: 'undead', amount: 2 }])
    expect(knAttackOptions([item('i5', 'weapon', 'mainHand', { weapon: { skill: 'bladedWeapons', speed: 0, damageType: 'slashing', traits: ['powerful'] } })])[0]).toMatchObject({ pool: 'D6+1' })
  })
})

describe('défenses du survivant', () => {
  const hit = (target: Parameters<typeof knResolveDamage>[0]['target']) =>
    knResolveDamage({ roll: { rolls: [5], total: 5 }, damageType: 'fire', criticalStrike: false, weakSpot: false, armor: 0, target })

  it('une réduction de dégâts retranche, après l\'Armure, sans passer sous zéro', () => {
    expect(hit({ vulnerable: [], resistant: [], restored: [], reduction: { fire: 2 } })).toMatchObject({ damage: 3, notes: ['réduction de dégâts : −2'] })
    expect(hit({ vulnerable: [], resistant: [], restored: [], reduction: { fire: 9 } }).damage).toBe(0)
    expect(hit({ vulnerable: [], resistant: [], restored: [], reduction: { cold: 2 } }).damage).toBe(5)
  })

  it('la réduction se retranche avant la Résistance', () => {
    expect(hit({ vulnerable: [], resistant: ['fire'], restored: [], reduction: { fire: 1 } }).damage).toBe(2)
  })

  const state = (): KnTableEffectState => ({
    coins: 0,
    xp: 0,
    provisions: emptyKnProvisions(),
    health: 10,
    toughness: 10,
    sanity: 10,
    aether: 10,
    exhaustion: 0,
    status: emptyKnStatus(),
    run: emptyKnRun(),
  })
  const maxima = { health: 10, toughness: 10, sanity: 10, aether: 10 }

  it('un état auquel le survivant est Immunisé ne se pose pas, et le résultat le dit', () => {
    const effects = [{ kind: 'condition' as const, key: 'stunned' as const }, { kind: 'condition' as const, key: 'poisoned' as const, value: 1 }]
    const { state: next, outcomes } = knApplyTableEffects(effects, state(), maxima, Math.random, { immune: ['stunned'] })

    expect(next.status.conditions).toEqual([{ key: 'poisoned', value: 1 }])
    expect(outcomes.map(outcome => outcome.blocked)).toEqual([true, undefined])
  })
})
