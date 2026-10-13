import { describe, it, expect } from 'vitest'
import { knInventorySchema, knIntegrityDown } from '../../shared/ker-nethalas/inventory'
import { knCatalogItemSchema, knItemFromCatalog, knItemsContentSchema, type KnCatalogItem } from '../../shared/ker-nethalas/items'

const sword: KnCatalogItem = {
  key: 'fakeSword',
  name: 'Épée factice',
  kind: 'weapon',
  weight: 'normal',
  value: 20,
  weapon: { skill: 'bladedWeapons', speed: 0, damageType: 'slashing', traits: ['parrying'] },
}
const mail: KnCatalogItem = { key: 'fakeMail', name: 'Maille factice', kind: 'torso', weight: 'normal', value: 150, protection: 2, integrity: 8, maneuverability: 15 }

describe('catalogue d\'objets', () => {
  it('une arme porte ses statistiques, et elles ne se posent que sur une arme', () => {
    expect(knItemsContentSchema.safeParse([sword]).success).toBe(true)
    expect(knItemsContentSchema.safeParse([{ ...sword, weapon: undefined }]).success).toBe(false)
    expect(knItemsContentSchema.safeParse([{ ...mail, weapon: sword.weapon }]).success).toBe(false)
  })

  it('refuse deux objets de même clé, et une provision inconnue', () => {
    expect(knItemsContentSchema.safeParse([sword, { ...mail, key: 'fakeSword' }]).success).toBe(false)
    expect(knCatalogItemSchema.safeParse({ ...mail, provision: 'torches' }).success).toBe(true)
    expect(knCatalogItemSchema.safeParse({ ...mail, provision: 'cailloux' }).success).toBe(false)
  })
})

describe('exemplaire d\'un objet du catalogue', () => {
  it('recopie les statistiques et se range au sac', () => {
    const item = knItemFromCatalog(sword, 'i1')

    expect(item).toMatchObject({ id: 'i1', ref: 'fakeSword', name: 'Épée factice', kind: 'weapon', quantity: 1, place: 'bag', value: 20 })
    expect(item.weapon).toEqual(sword.weapon)
    expect(knInventorySchema.safeParse([item]).success).toBe(true)
  })

  it('une armure achetée a toute son Intégrité, trouvée elle a un cran de moins', () => {
    expect(knItemFromCatalog(mail, 'i1').integrity).toEqual({ max: 8, current: 8 })
    expect(knItemFromCatalog(mail, 'i1', { found: true }).integrity).toEqual({ max: 8, current: 6 })
    expect(knItemFromCatalog({ ...mail, integrity: 4 }, 'i1', { found: true }).integrity).toEqual({ max: 4, current: 4 })
  })

  it('la chaîne des dés descend d\'un cran jusqu\'au D4', () => {
    expect([12, 10, 8, 6, 4].map(die => knIntegrityDown(die as 12))).toEqual([10, 8, 6, 4, 4])
  })
})
