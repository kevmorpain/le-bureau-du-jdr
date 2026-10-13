import { describe, it, expect } from 'vitest'
import { emptyKnProvisions } from '../../shared/ker-nethalas/camp'
import type { KnItem } from '../../shared/ker-nethalas/inventory'
import type { KnCatalogItem } from '../../shared/ker-nethalas/items'
import {
  KN_LOOT_TABLES,
  knApplyLoot,
  knLootContentSchema,
  knLootTableSchema,
  knRollLoot,
  type KnLootContent,
  type KnLootDrop,
  type KnLootState,
  type KnLootTable,
} from '../../shared/ker-nethalas/loot'
import { knBuy, knSell, knSellPrice, knSellProvision, type KnTradeState } from '../../shared/ker-nethalas/trade'

const d = (count: number, sides: number, bonus = 0) => ({ count, sides, bonus })
const table = (die: number, rows: [number, string, KnLootDrop, string?][]): KnLootTable => {
  let min = 1
  return {
    die,
    entries: rows.map(([span, text, drop, title]) => {
      const entry = { min, max: min + span - 1, text, drop, ...(title ? { title } : {}) }
      min += span
      return entry
    }),
  }
}

const content: KnLootContent = {
  spoils: table(6, [[3, 'ordinaires', { kind: 'table', table: 'mundane' }], [3, 'de valeur', { kind: 'table', table: 'valuable' }]]),
  mundane: table(100, [
    [50, 'Torches', { kind: 'item', ref: 'torch', count: d(1, 4) }],
    [30, 'Épée factice', { kind: 'item', ref: 'fakeSword' }],
    [20, 'Gemmes', { kind: 'table', table: 'gems' }],
  ]),
  gems: table(20, [[20, 'Précieux', { kind: 'gem', value: d(3, 100) }]]),
  valuable: table(20, [[10, 'Fragment', { kind: 'fragment' }, 'Chaîne'], [10, 'Objet magique', { kind: 'magic' }]]),
  resources: table(10, [[10, 'Rien', { kind: 'nothing' }]]),
}

const catalog: KnCatalogItem[] = [
  { key: 'torch', name: 'Torche', kind: 'gear', weight: 'light', value: 10, provision: 'torches' },
  { key: 'fakeMail', name: 'Maille factice', kind: 'torso', weight: 'normal', value: 150, protection: 2, integrity: 8 },
  { key: 'fakeSword', name: 'Épée factice', kind: 'weapon', weight: 'normal', value: 20, weapon: { skill: 'bladedWeapons', speed: 0, damageType: 'slashing', traits: [] } },
]

const state = (): KnLootState => ({ inventory: [], provisions: emptyKnProvisions() })
const sequence = (...values: number[]) => {
  let i = 0
  return () => values[i++ % values.length]!
}

describe('tables de butin', () => {
  it('une table couvre son dé sans trou, et le jeu de données accepte des tables absentes', () => {
    expect(knLootTableSchema(6).safeParse(content.spoils).success).toBe(true)
    expect(knLootTableSchema(6).safeParse({ die: 6, entries: [{ min: 1, max: 5, text: 'x', drop: { kind: 'nothing' } }] }).success).toBe(false)
    expect(knLootContentSchema.safeParse({ spoils: content.spoils }).success).toBe(true)
    expect(knLootContentSchema.safeParse({ spoils: { ...content.spoils, die: 8 } }).success).toBe(false)
    expect(KN_LOOT_TABLES.mundane).toBe(100)
  })

  it('un tirage suit la chaîne des tables jusqu\'à un résultat qui donne quelque chose', () => {
    // D6 = 6 (de valeur), puis D20 = 1 (fragment)
    const result = knRollLoot(content, 'spoils', sequence(0.99, 0))

    expect(result).toMatchObject({ drop: { kind: 'fragment' }, count: 1 })
    expect('steps' in result && result.steps.map(s => [s.table, s.roll])).toEqual([['spoils', 6], ['valuable', 1]])
    expect('steps' in result && result.steps[1]!.title).toBe('Chaîne')
  })

  it('une quantité en dés est tirée, d\'au moins 1 ; une gemme tire sa valeur', () => {
    const items = knRollLoot(content, 'mundane', sequence(0, 0.99))
    const gem = knRollLoot(content, 'mundane', sequence(0.99, 0.5, 0.2, 0.9, 0))

    expect(items).toMatchObject({ drop: { kind: 'item', ref: 'torch' }, count: 4 })
    expect(gem).toMatchObject({ drop: { kind: 'gem' }, value: 21 + 91 + 1 })
  })

  it('rend la table qui manque plutôt qu\'un résultat inventé', () => {
    expect(knRollLoot({ spoils: content.spoils }, 'spoils', sequence(0))).toEqual({ missing: 'mundane' })
    expect(knRollLoot({}, 'spoils')).toEqual({ missing: 'spoils' })
  })
})

describe('ajouter le butin', () => {
  const rolled = (start: Parameters<typeof knRollLoot>[1], ...values: number[]) => knRollLoot(content, start, sequence(...values)) as Exclude<ReturnType<typeof knRollLoot>, { missing: unknown }>

  it('une provision du catalogue s\'ajoute aux provisions, avec la quantité tirée', () => {
    const { state: next, lines } = knApplyLoot(state(), rolled('mundane', 0, 0.99), catalog)

    expect(next.provisions.torches).toBe(4)
    expect(next.inventory).toEqual([])
    expect(lines).toEqual(['4 × Torche'])
  })

  it('un objet du catalogue arrive trouvé : une armure a une Intégrité d\'un cran en moins', () => {
    const mail = knApplyLoot(state(), { steps: [{ table: 'armor' as const, die: 10, roll: 1, text: 'Maille' }], drop: { kind: 'item', ref: 'fakeMail' }, count: 1, value: 0 }, catalog)
    const sword = knApplyLoot(state(), rolled('mundane', 0.6), catalog)

    expect(mail.state.inventory[0]).toMatchObject({ name: 'Maille factice', ref: 'fakeMail', place: 'bag', integrity: { max: 8, current: 6 } })
    expect(sword.state.inventory[0]).toMatchObject({ name: 'Épée factice', id: 'i1' })
  })

  it('une gemme garde sa valeur tirée et se range par centaine', () => {
    const { state: next } = knApplyLoot(state(), rolled('mundane', 0.99, 0.5, 0.2, 0.9, 0), catalog)

    expect(next.inventory[0]).toMatchObject({ name: 'Gemme : Précieux', kind: 'gems', weight: 'bulk', value: 113, quantity: 1 })
  })

  it('un fragment se garde tel quel, un objet magique arrive non harmonisé ; rien ne donne rien', () => {
    const fragment = knApplyLoot(state(), rolled('valuable', 0), catalog)
    const magic = knApplyLoot(state(), rolled('valuable', 0.99), catalog)

    expect(fragment.state.inventory[0]).toMatchObject({ name: 'Fragment : Chaîne', kind: 'fragment', weight: 'light' })
    expect(magic.state.inventory[0]).toMatchObject({ name: 'Anneau', kind: 'ring', magic: { table: 'ring', identified: false } })
    expect(knApplyLoot(state(), rolled('resources', 0), catalog)).toEqual({ state: state(), lines: [] })
  })

  it('un livre de savoir tire le D10 des livres : il prend le titre du livre et son résumé en note', () => {
    const withBooks: KnLootContent = {
      ...content,
      mundane: table(100, [[100, 'Livre de savoir', { kind: 'item', ref: 'loreBook' }]]),
      loreBooks: table(10, [[5, 'Un premier livre.', { kind: 'nothing' }, 'Premier'], [5, 'Un second livre.', { kind: 'nothing' }, 'Second']]),
    }
    const books: KnCatalogItem[] = [{ key: 'loreBook', name: 'Livre de savoir', kind: 'gear', weight: 'light', value: 10 }]
    const result = knRollLoot(withBooks, 'mundane', sequence(0, 0.9)) as Exclude<ReturnType<typeof knRollLoot>, { missing: unknown }>
    const applied = knApplyLoot(state(), result, books)

    expect(result.loreBook).toEqual({ roll: 10, title: 'Second', text: 'Un second livre.' })
    expect(applied.state.inventory[0]).toMatchObject({ name: 'Livre de savoir : Second', note: 'Un second livre.' })
    expect(applied.lines).toEqual(['Livre de savoir : Second'])
    expect(applied.xp).toBe(10)
    expect(knApplyLoot(state(), knRollLoot(content, 'mundane', sequence(0.6)) as never, catalog).xp).toBeUndefined()
    expect(knApplyLoot({ ...state(), inventory: Array.from({ length: 120 }, (_, i) => ({ id: `i${i}`, name: 'x', kind: 'gear', weight: 'normal', quantity: 1, place: 'bag' }) satisfies KnItem) }, result, books).xp).toBeUndefined()
    expect(knRollLoot(content, 'mundane', sequence(0.6))).not.toHaveProperty('loreBook')
  })

  it('un objet absent du catalogue le dit, et un inventaire plein ne reçoit plus rien', () => {
    const unknown = knApplyLoot(state(), { steps: [{ table: 'mundane' as const, die: 100, roll: 1, text: 'Mystère' }], drop: { kind: 'item', ref: 'inconnu' }, count: 1, value: 0 }, catalog)
    const full: KnLootState = { ...state(), inventory: Array.from({ length: 120 }, (_, i) => ({ id: `i${i}`, name: 'x', kind: 'gear', weight: 'normal', quantity: 1, place: 'bag' }) satisfies KnItem) }

    expect(unknown.lines[0]).toContain('absent du catalogue')
    expect(knApplyLoot(full, rolled('mundane', 0.6), catalog).state.inventory).toHaveLength(120)
  })
})

describe('marchand', () => {
  const trade = (coins: number): KnTradeState => ({ coins, inventory: [], provisions: emptyKnProvisions() })

  it('vend à la moitié du prix, arrondie au supérieur, et à la valeur entière pour les gemmes', () => {
    expect(knSellPrice({ kind: 'weapon', value: 25, quantity: 1 })).toBe(13)
    expect(knSellPrice({ kind: 'gear', value: 10, quantity: 3 })).toBe(15)
    expect(knSellPrice({ kind: 'gems', value: 163, quantity: 1 })).toBe(163)
    expect(knSellPrice({ kind: 'gear', quantity: 1 })).toBe(0)
  })

  it('acheter retire les pièces, ajoute l\'objet ou la provision, et refuse sans assez de pièces', () => {
    const sword = knBuy(trade(50), catalog[2]!)
    const torches = knBuy(trade(50), catalog[0]!, 3)

    expect(sword).toMatchObject({ state: { coins: 30, inventory: [{ name: 'Épée factice' }] } })
    expect(torches).toMatchObject({ state: { coins: 20, provisions: { torches: 3 } } })
    expect(knBuy(trade(5), catalog[2]!)).toEqual({ error: 'coins' })
    expect(knBuy(trade(20), catalog[1]!)).toEqual({ error: 'coins' })
  })

  it('acheter une armure donne toute son Intégrité', () => {
    const bought = knBuy(trade(500), catalog[1]!)

    expect(bought).toMatchObject({ state: { inventory: [{ integrity: { max: 8, current: 8 } }] } })
  })

  it('vendre rend les pièces et retire l\'objet ; vendre une provision retire une unité', () => {
    const owned: KnTradeState = { coins: 0, provisions: { ...emptyKnProvisions(), torches: 2 }, inventory: [{ id: 'g', name: 'Gemme', kind: 'gems', weight: 'bulk', quantity: 1, place: 'bag', value: 80 }] }

    expect(knSell(owned, 'g')).toMatchObject({ state: { coins: 80, inventory: [] } })
    expect(knSell(owned, 'absent')).toEqual({ error: 'unknown' })
    expect(knSellProvision(owned, catalog[0]!)).toMatchObject({ state: { coins: 5, provisions: { torches: 1 } } })
    expect(knSellProvision(owned, catalog[0]!, 3)).toEqual({ error: 'stock' })
    expect(knSellProvision(owned, catalog[2]!)).toEqual({ error: 'unknown' })
  })
})
