import { describe, it, expect } from 'vitest'
import {
  knBeltCheck,
  knBodySlotCount,
  knBodySlotMax,
  knCarryCapacity,
  knEncumbrance,
  knInventoryIssues,
  knInventorySchema,
  knNewItem,
  knNextItemId,
  knPlaceItem,
  knPlacesFor,
  knQuickSlotCount,
  knRemoveItem,
  type KnItem,
} from '../../shared/ker-nethalas/inventory'

const item = (id: string, patch: Partial<KnItem> = {}): KnItem => ({ id, name: `Objet ${id}`, kind: 'gear', weight: 'normal', quantity: 1, place: 'bag', ...patch })
const weapon = (id: string, traits: ('twoHanded' | 'quick')[] = []): KnItem => item(id, { kind: 'weapon', weapon: { skill: 'bladedWeapons', speed: 0, damageType: 'slashing', traits } })
const placed = (items: KnItem[], id: string, place: Parameters<typeof knPlaceItem>[2], slot?: number): KnItem[] => {
  const result = knPlaceItem(items, id, place, slot)
  if ('error' in result) throw new Error(result.error)
  return result.items
}
const carried = { provisions: 0, coins: 0, amulets: 0 }

describe('capacité et emplacements rapides', () => {
  it('un survivant sans sac ni Ceinture a 10 emplacements et aucun emplacement rapide', () => {
    expect(knCarryCapacity([])).toBe(10)
    expect(knQuickSlotCount([])).toBe(0)
  })

  it('le sac à dos ajoute 20 emplacements, chaque pochette 5, seulement quand ils sont portés', () => {
    const bags = [item('a', { kind: 'backpack' }), item('b', { kind: 'pouch' }), item('c', { kind: 'pouch' })]

    expect(knCarryCapacity(bags)).toBe(10)
    const worn = placed(placed(placed(bags, 'a', 'backpack'), 'b', 'pouch'), 'c', 'pouch')
    expect(knCarryCapacity(worn)).toBe(10 + 20 + 5 + 5)
    expect(knCarryCapacity(worn, 10)).toBe(50)
  })

  it('la Ceinture portée ouvre 4 emplacements rapides', () => {
    const items = placed([item('b', { kind: 'belt' })], 'b', 'belt')

    expect(knQuickSlotCount(items)).toBe(4)
  })
})

describe('encombrement', () => {
  it('compte un emplacement par objet normal et deux par objet lourd', () => {
    const items = [item('a'), item('b'), item('c', { weight: 'heavy' })]

    expect(knEncumbrance(items, carried)).toMatchObject({ used: 4, capacity: 10, over: false, normal: 2, heavy: 2 })
  })

  it('range les objets légers par dix, provisions et amulettes comprises, et les pièces par centaine', () => {
    const items = [item('a', { weight: 'light', quantity: 4 }), item('g', { kind: 'gems', weight: 'bulk', quantity: 30 })]
    const one = knEncumbrance(items, { provisions: 6, coins: 70, amulets: 0 })
    const two = knEncumbrance(items, { provisions: 7, coins: 71, amulets: 0 })

    expect(one).toMatchObject({ light: 1, bulk: 1, used: 2 })
    expect(two).toMatchObject({ light: 2, bulk: 2, used: 4 })
    expect(knEncumbrance([], carried)).toMatchObject({ used: 0, light: 0, bulk: 0 })
  })

  it('ne compte ni ce qui est porté ni ce qui est rangé à la Ceinture, et signale un dépassement', () => {
    const base = [item('belt', { kind: 'belt' }), weapon('w'), item('p', { kind: 'gear' })]
    const items = placed(placed(placed(base, 'belt', 'belt'), 'w', 'mainHand'), 'p', 'quick')

    expect(knEncumbrance(items, carried).used).toBe(0)
    expect(knEncumbrance(Array.from({ length: 11 }, (_, i) => item(`n${i}`)), carried)).toMatchObject({ used: 11, over: true })
  })

  it('perdre le sac à dos ramène la capacité à 10 et peut dépasser', () => {
    const items = placed([item('s', { kind: 'backpack' }), ...Array.from({ length: 15 }, (_, i) => item(`n${i}`))], 's', 'backpack')
    const without = placed(items, 's', 'bag')

    expect(knEncumbrance(items, carried).over).toBe(false)
    expect(knEncumbrance(without, carried)).toMatchObject({ capacity: 10, used: 16, over: true })
  })
})

describe('porter un objet', () => {
  it('refuse un objet à un endroit qui ne lui va pas', () => {
    expect(knPlaceItem([weapon('w')], 'w', 'head')).toEqual({ error: 'wrongKind' })
    expect(knPlaceItem([item('s', { kind: 'backpack' })], 's', 'quick')).toEqual({ error: 'wrongKind' })
    expect(knPlacesFor('torso')).toEqual(['bag', 'quick', 'armor'])
  })

  it('un emplacement unique déjà pris renvoie son objet au sac', () => {
    const items = placed([weapon('a'), weapon('b')], 'a', 'mainHand')
    const swapped = placed(items, 'b', 'mainHand')

    expect(swapped.map(i => [i.id, i.place])).toEqual([['a', 'bag'], ['b', 'mainHand']])
  })

  it('une armure se compose d\'un torse, de vambraces et de jambières, un de chaque', () => {
    const items = [item('t1', { kind: 'torso' }), item('t2', { kind: 'torso' }), item('v', { kind: 'vambraces' }), item('g', { kind: 'greaves' })]
    const worn = placed(placed(placed(items, 't1', 'armor'), 'v', 'armor'), 'g', 'armor')
    const swapped = placed(worn, 't2', 'armor')

    expect(worn.filter(i => i.place === 'armor')).toHaveLength(3)
    expect(swapped.find(i => i.id === 't1')!.place).toBe('bag')
    expect(swapped.filter(i => i.place === 'armor').map(i => i.id).sort()).toEqual(['g', 't2', 'v'])
    expect(knBodySlotCount(swapped, false)).toBe(1)
  })

  it('deux anneaux au plus', () => {
    const items = [item('r1', { kind: 'ring' }), item('r2', { kind: 'ring' }), item('r3', { kind: 'ring' })]
    const two = placed(placed(items, 'r1', 'ring'), 'r2', 'ring')

    expect(knPlaceItem(two, 'r3', 'ring')).toEqual({ error: 'full' })
  })

  it('une arme à deux mains libère l\'autre main et se tient à la main principale', () => {
    const items = [weapon('big', ['twoHanded']), weapon('small'), item('sh', { kind: 'shield' })]
    const armed = placed(placed(items, 'small', 'mainHand'), 'sh', 'offHand')
    const big = placed(armed, 'big', 'mainHand')

    expect(big.find(i => i.id === 'sh')!.place).toBe('bag')
    expect(big.find(i => i.id === 'small')!.place).toBe('bag')
    expect(knPlaceItem(big, 'sh', 'offHand')).toMatchObject({ items: expect.any(Array) })
    expect(placed(big, 'sh', 'offHand').find(i => i.id === 'big')!.place).toBe('bag')
    expect(knPlaceItem(items, 'big', 'offHand')).toEqual({ error: 'twoHandedOffHand' })
    expect(knBodySlotMax(big)).toBe(9)
    expect(knBodySlotMax(armed)).toBe(10)
  })

  it('un objet porté est unique : une pile reste dans le sac', () => {
    expect(knPlaceItem([item('a', { kind: 'ring', quantity: 2 })], 'a', 'ring')).toEqual({ error: 'notUnique' })
  })
})

describe('emplacements rapides de la Ceinture', () => {
  const withBelt = () => placed([item('belt', { kind: 'belt' }), item('a'), item('b'), item('c', { quantity: 3, weight: 'light' })], 'belt', 'belt')

  it('exigent une Ceinture portée et reçoivent un objet par case', () => {
    expect(knPlaceItem([item('a')], 'a', 'quick')).toEqual({ error: 'noBelt' })
    const items = placed(placed(withBelt(), 'a', 'quick'), 'b', 'quick')

    expect(items.filter(i => i.place === 'quick').map(i => i.slot)).toEqual([1, 2])
    expect(knPlaceItem(items, 'c', 'quick', 1)).toEqual({ error: 'slotTaken' })
    expect(placed(items, 'c', 'quick', 4).find(i => i.id === 'c')!.slot).toBe(4)
  })

  it('une pile peut y tenir, et la sortir rend la case', () => {
    const items = placed(placed(withBelt(), 'c', 'quick'), 'c', 'bag')

    expect(items.find(i => i.id === 'c')).toMatchObject({ place: 'bag', quantity: 3 })
    expect(items.find(i => i.id === 'c')).not.toHaveProperty('slot')
  })

  it('retirer la Ceinture, ou la détruire, renvoie ses objets au sac', () => {
    const items = placed(placed(withBelt(), 'a', 'quick'), 'b', 'quick')
    const unworn = placed(items, 'belt', 'bag')

    expect(unworn.filter(i => i.place === 'quick')).toEqual([])
    expect(unworn.find(i => i.id === 'a')).toMatchObject({ place: 'bag' })
    expect(knRemoveItem(items, 'belt').every(i => i.place === 'bag')).toBe(true)
  })

  it('un test de Ceinture détruit l\'objet de la case tirée, et rien si elle est vide', () => {
    const items = placed(placed(withBelt(), 'a', 'quick'), 'b', 'quick')
    const hit = knBeltCheck(items, 2)

    expect(hit.destroyed!.id).toBe('b')
    expect(hit.items.map(i => i.id)).not.toContain('b')
    expect(knBeltCheck(items, 4)).toEqual({ items })
  })
})

describe('validité d\'un inventaire enregistré', () => {
  it('accepte un inventaire cohérent et refuse ce qu\'aucune action de l\'outil ne produit', () => {
    const ok = placed([weapon('w'), item('belt', { kind: 'belt' })], 'w', 'mainHand')

    expect(knInventorySchema.safeParse(ok).success).toBe(true)
    expect(knInventorySchema.safeParse([item('a', { place: 'quick', slot: 1 })]).success).toBe(false)
    expect(knInventorySchema.safeParse([item('a', { place: 'head' })]).success).toBe(false)
    expect(knInventorySchema.safeParse([item('a'), item('a')]).success).toBe(false)
    expect(knInventorySchema.safeParse([weapon('w', ['twoHanded']), item('s', { kind: 'shield' })].map((entry, i) => ({ ...entry, place: i ? 'offHand' : 'mainHand' }))).success).toBe(false)
    expect(knInventoryIssues([item('a', { kind: 'ring', place: 'ring', quantity: 2 })])).toHaveLength(1)
  })

  it('crée des objets au sac avec un identifiant libre', () => {
    const items = [item('i1'), item('i3')]

    expect(knNextItemId(items)).toBe('i2')
    expect(knNewItem({ name: 'Torche', kind: 'gear', weight: 'light' }, 'i9')).toMatchObject({ id: 'i9', place: 'bag', quantity: 1 })
  })
})
