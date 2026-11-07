import { describe, it, expect } from 'vitest'
import { itemsData } from '../../server/db/seeds/data/items'
import { AMMUNITION_TYPES, ammunitionAvailable, stackToSpend, type AmmunitionStack } from '../../shared/rules/ammunition'

const stacks: AmmunitionStack[] = [
  { entryId: 1, quantity: 0, ammunitionType: 'arrow' },
  { entryId: 2, quantity: 12, ammunitionType: 'arrow' },
  { entryId: 3, quantity: 20, ammunitionType: 'bolt' },
  { entryId: 4, quantity: 5, ammunitionType: null },
]

describe('munitions', () => {
  it('additionne les piles du type demandé', () => {
    expect(ammunitionAvailable(stacks, 'arrow')).toBe(12)
    expect(ammunitionAvailable(stacks, 'bolt')).toBe(20)
    expect(ammunitionAvailable(stacks, 'bullet')).toBe(0)
  })

  it('prélève sur la première pile non vide du bon type', () => {
    expect(stackToSpend(stacks, 'arrow')?.entryId).toBe(2)
    expect(stackToSpend(stacks, 'needle')).toBeNull()
  })

  it('une pile épuisée ne se prélève plus', () => {
    expect(stackToSpend([{ entryId: 1, quantity: 0, ammunitionType: 'arrow' }], 'arrow')).toBeNull()
  })
})

describe('munitions du catalogue seedé', () => {
  const weapons = itemsData.filter(i => i.itemType === 'weapon' && (i.properties as { weapon_properties: string[] }).weapon_properties.includes('ammunition'))
  const ammo = itemsData.filter(i => (i.properties as { category?: string }).category === 'Munition')

  it('chaque arme à munitions dit quelle munition elle tire', () => {
    expect(weapons.length).toBeGreaterThan(0)
    for (const w of weapons) expect((w.properties as { ammunition_type?: string }).ammunition_type, w.name).toBeDefined()
  })

  it('chaque type de munition a un objet, et un seul', () => {
    for (const type of AMMUNITION_TYPES) {
      expect(ammo.filter(a => (a.properties as { ammunition_type?: string }).ammunition_type === type), type).toHaveLength(1)
    }
  })

  it('chaque type tiré par une arme a sa munition', () => {
    const owned = new Set(ammo.map(a => (a.properties as { ammunition_type?: string }).ammunition_type))
    for (const w of weapons) expect(owned.has((w.properties as { ammunition_type?: string }).ammunition_type), w.name).toBe(true)
  })
})
