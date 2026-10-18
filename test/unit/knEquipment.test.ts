import { describe, it, expect } from 'vitest'
import {
  KN_UNARMED_OPTION,
  knDropItem,
  knPickUpItem,
  knWieldedWeapons,
  knArmorByZone,
  knArmorPieces,
  knAttackOptions,
  knDefenseOptions,
  knEquipmentSources,
  knHasThievesToolkit,
  knInitiativeBonus,
  knRepairItem,
  knRollIntegrity,
  knWeaponPool,
} from '../../shared/ker-nethalas/equipment'
import type { KnItem, KnWeaponTrait } from '../../shared/ker-nethalas/inventory'
import { emptyKnRun, knMarkGearUsed, knStartCombat } from '../../shared/ker-nethalas/run'

const item = (id: string, patch: Partial<KnItem> = {}): KnItem => ({ id, name: `Objet ${id}`, kind: 'gear', weight: 'normal', quantity: 1, place: 'bag', ...patch })
const weapon = (id: string, place: KnItem['place'], traits: KnWeaponTrait[] = [], skill: 'bladedWeapons' | 'shaftedWeapons' = 'bladedWeapons'): KnItem =>
  item(id, { kind: 'weapon', place, weapon: { skill, speed: 5, damageType: 'slashing', traits } })
const piece = (id: string, kind: KnItem['kind'], place: KnItem['place'], protection: number, extra: Partial<KnItem> = {}): KnItem => item(id, { kind, place, protection, ...extra })

describe('armure portée', () => {
  const worn = [
    piece('t', 'torso', 'armor', 2, { maneuverability: 15 }),
    piece('v', 'vambraces', 'armor', 1),
    piece('h', 'helmet', 'head', 3, { perception: 10 }),
    piece('spare', 'torso', 'bag', 3),
  ]

  it('chaque zone reçoit la protection de sa pièce portée, et rien de ce qui reste dans le sac', () => {
    expect(knArmorByZone(worn)).toEqual({ head: 3, torso: 2, arms: 1, legs: 0 })
    expect(knArmorPieces(worn, 'torso').map(p => p.id)).toEqual(['t'])
    expect(knArmorByZone([])).toEqual({ head: 0, torso: 0, arms: 0, legs: 0 })
  })

  it('l\'Armure d\'un effet s\'ajoute à chaque zone, pièce portée ou non', () => {
    expect(knArmorByZone(worn, 1)).toEqual({ head: 4, torso: 3, arms: 2, legs: 1 })
    expect(knArmorByZone([], 1)).toEqual({ head: 1, torso: 1, arms: 1, legs: 1 })
  })

  it('les Outils de voleur donnent +5 en Larcin tant qu\'ils sont là et entiers', () => {
    const toolkit = item('k', { ref: 'thievesToolkit' })

    expect(knHasThievesToolkit([toolkit])).toBe(true)
    expect(knHasThievesToolkit([item('k', { ref: 'thievesToolkit', broken: true }), item('x')])).toBe(false)
    expect(knEquipmentSources([toolkit])).toEqual([expect.objectContaining({ id: 'thievesToolkit', effects: [{ type: 'modifier', targets: ['thievery'], amount: 5 }] })])
    expect(knEquipmentSources([item('x')])).toEqual([])
  })

  it('l\'armure gêne l\'agilité et le casque la Perception', () => {
    const [source] = knEquipmentSources(worn)

    expect(source!.effects).toEqual([
      { type: 'modifier', targets: ['acrobatics', 'dodge', 'stealth'], amount: -15 },
      { type: 'modifier', targets: ['perception'], amount: -10 },
    ])
    expect(knEquipmentSources([piece('v', 'vambraces', 'armor', 1)])).toEqual([])
  })
})

describe('attaquer avec ce qu\'on tient', () => {
  it('à mains nues sans arme, avec chaque arme tenue sinon', () => {
    expect(knAttackOptions([weapon('w', 'bag')])).toEqual([KN_UNARMED_OPTION])
    const options = knAttackOptions([weapon('a', 'mainHand'), weapon('b', 'offHand', ['simple'])])

    expect(options.map(o => o.id)).toEqual(['a', 'b', 'unarmed'])
    expect(options[1]).toMatchObject({ skill: 'bladedWeapons', speed: 5, bonus: 10, damageType: 'slashing' })
  })

  it('la réserve de dégâts suit les Traits : Puissante +1, À deux mains +2, Polyvalente +1 main libre', () => {
    expect(knWeaponPool(weapon('w', 'mainHand'), true)).toBe('D6')
    expect(knWeaponPool(weapon('w', 'mainHand', ['powerful']), true)).toBe('D6+1')
    expect(knWeaponPool(weapon('w', 'mainHand', ['twoHanded']), true)).toBe('D6+2')
    expect(knWeaponPool(weapon('w', 'mainHand', ['versatile']), true)).toBe('D6+1')
    expect(knWeaponPool(weapon('w', 'mainHand', ['versatile']), false)).toBe('D6')
    expect(knWeaponPool(weapon('w', 'mainHand', ['powerful', 'versatile']), true)).toBe('D6+2')
  })

  it('une arme Rapide donne +10 à l\'Initiative, une seule fois', () => {
    expect(knInitiativeBonus([weapon('w', 'mainHand')])).toBe(0)
    expect(knInitiativeBonus([weapon('a', 'mainHand', ['quick']), weapon('b', 'offHand', ['quick'])])).toBe(10)
    expect(knInitiativeBonus([weapon('w', 'bag', ['quick'])])).toBe(0)
  })
})

describe('se défendre avec ce qu\'on tient', () => {
  it('toujours à l\'Esquive ; à l\'arme seulement si elle Pare', () => {
    expect(knDefenseOptions([]).map(o => o.id)).toEqual(['dodge'])
    expect(knDefenseOptions([weapon('w', 'mainHand')]).map(o => o.id)).toEqual(['dodge'])
    expect(knDefenseOptions([weapon('w', 'mainHand', ['parrying'], 'shaftedWeapons')])).toMatchObject([
      { id: 'dodge' },
      { id: 'parry:w', kind: 'parry', skill: 'shaftedWeapons', bonus: 0, used: [] },
    ])
  })

  it('un bouclier permet de parer avec toute arme tenue et ajoute son bonus, +10 pour une arme Défensive', () => {
    const shield = item('s', { kind: 'shield', place: 'offHand', parry: 10 })
    const options = knDefenseOptions([weapon('d', 'mainHand', ['defensive']), shield])

    expect(options.find(o => o.id === 'parry:d')).toMatchObject({ bonus: 20, used: ['s'], shield: 'Objet s' })
    expect(knDefenseOptions([weapon('w', 'mainHand'), shield]).find(o => o.id === 'parry:w')!.bonus).toBe(10)
  })
})

describe('Intégrité', () => {
  const armor = (current: 4 | 6 | 8): KnItem => piece('a', 'torso', 'armor', 2, { integrity: { max: 8, current } })

  it('un 1 ou un 2 fait baisser le dé d\'un cran, un autre résultat laisse tenir', () => {
    const low = knRollIntegrity([armor(8)], 'a', () => 0.01)
    const high = knRollIntegrity([armor(8)], 'a', () => 0.99)

    expect(low.result).toMatchObject({ die: 8, roll: 1, outcome: 'down', to: 6 })
    expect(low.items[0]!.integrity).toEqual({ max: 8, current: 6 })
    expect(high.result).toMatchObject({ roll: 8, outcome: 'held' })
    expect(high.items[0]!.integrity).toEqual({ max: 8, current: 8 })
  })

  it('au D4, un 1 ou un 2 détruit la pièce', () => {
    const lost = knRollIntegrity([armor(4), item('x')], 'a', () => 0.4)

    expect(lost.result).toMatchObject({ die: 4, roll: 2, outcome: 'destroyed' })
    expect(lost.items.map(i => i.id)).toEqual(['x'])
  })

  it('un objet sans Intégrité ne joue rien', () => {
    expect(knRollIntegrity([item('x')], 'x')).toEqual({ items: [item('x')] })
  })

  it('réparer remonte d\'un cran sans dépasser le maximum', () => {
    const repaired = knRepairItem([armor(4)], 'a')
    const twice = knRepairItem(repaired, 'a')
    const full = knRepairItem([armor(8)], 'a')

    expect(repaired[0]!.integrity!.current).toBe(6)
    expect(twice[0]!.integrity!.current).toBe(8)
    expect(full[0]!.integrity!.current).toBe(8)
  })
})

describe('pièces utilisées pendant un combat', () => {
  it('se retiennent une fois chacune, et seulement pendant un combat', () => {
    const run = knStartCombat(emptyKnRun(), [{ name: 'A', health: 3, maxHealth: 3 }])
    const marked = knMarkGearUsed(knMarkGearUsed(run, ['a', 'b']), ['b', 'c'])

    expect(marked.combat!.gearUsed).toEqual(['a', 'b', 'c'])
    expect(knMarkGearUsed(emptyKnRun(), ['a'])).toEqual(emptyKnRun())
    expect(knMarkGearUsed(run, [])).toBe(run)
  })
})

describe('arme lâchée ou fichée au sol', () => {
  const sword = weapon('a', 'mainHand')
  const dagger = weapon('b', 'offHand')

  it('une arme à terre ne sert plus, jusqu\'à ce qu\'on la ramasse', () => {
    const dropped = knDropItem([sword, dagger], 'a', 'floor')

    expect(dropped[0]).toMatchObject({ id: 'a', dropped: 'floor' })
    expect(knWieldedWeapons(dropped).map(item => item.id)).toEqual(['b'])
    expect(knAttackOptions(dropped).map(option => option.id)).toEqual(['b', 'unarmed'])
    expect(knPickUpItem(dropped, 'a')[0]).not.toHaveProperty('dropped')
    expect(knWieldedWeapons(knPickUpItem(dropped, 'a')).map(item => item.id)).toEqual(['a', 'b'])
  })

  it('seule une arme se lâche, et une arme fichée au sol est traitée de même', () => {
    const items = [sword, item('g', { kind: 'gear' })]

    expect(knDropItem(items, 'g', 'floor')[1]).not.toHaveProperty('dropped')
    expect(knDropItem(items, 'a', 'stuck')[0]).toMatchObject({ dropped: 'stuck' })
    expect(knAttackOptions(knDropItem(items, 'a', 'stuck'))).toEqual([KN_UNARMED_OPTION])
  })
})
