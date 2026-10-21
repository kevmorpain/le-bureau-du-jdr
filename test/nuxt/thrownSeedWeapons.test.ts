import { describe, it, expect, vi } from 'vitest'
import { reactive } from 'vue'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import InventorySection from '../../app/components/character_sheet/InventorySection.vue'
import { itemsData } from '../../server/db/seeds/data/items'
import { baseScores, inventoryEntry as entry, mountSheet as mount } from './fixtures/mountSheet'

// Les armes de lancer du catalogue (hachette, javeline, dague, marteau léger…) doivent offrir un lancer, sur la fiche
// comme à l'inventaire : le test part des objets seedés, pas de copies écrites à la main.

const seedWeapon = (name: string) => itemsData.find(i => i.name === name && i.itemType === 'weapon')!

const throwable = itemsData.filter(i =>
  i.itemType === 'weapon'
  && (i.properties as { weapon_properties: string[] }).weapon_properties.includes('thrown')
  && !(i.properties as { weapon_category: string }).weapon_category.endsWith('ranged'),
)

describe('armes de lancer du catalogue — fiche', () => {
  it('le catalogue compte bien des armes de corps à corps à lancer, hachette et javeline comprises', () => {
    const names = throwable.map(i => i.name)
    expect(names).toEqual(expect.arrayContaining(['Hachette', 'Javeline', 'Dague']))
  })

  it('chacune offre un lancer avec une portée et un choix de distance', async () => {
    const s = await mount({
      scores: baseScores(14, 12, 10, 10),
      classes: [{ classId: 3, level: 3 }],
      worn: id => throwable.map((item, index) => entry(id, index + 1, item.name, 'weapon', item.properties as unknown as Record<string, unknown>)),
    })
    for (const item of throwable) {
      const stats = s.equippedWeaponStats.value.find(w => w.name === item.name)!
      expect(stats.thrown, item.name).not.toBeNull()
      expect(stats.rangeChoice, item.name).not.toBeNull()
      expect(stats.rangeText, item.name).toMatch(/ m \/ \d+ m$/)
    }
  })
})

const SHEET_ID = 9701

const rowOf = (id: number, name: string, equipped: boolean) => ({
  ...entry(SHEET_ID, id, name, 'weapon', seedWeapon(name).properties as unknown as Record<string, unknown>),
  equipped,
})

describe('armes de lancer du catalogue — inventaire', () => {
  registerEndpoint(`/api/character_sheets/${SHEET_ID}/inventory`, () => [rowOf(1, 'Hachette', true), rowOf(2, 'Javeline', true), rowOf(3, 'Dague', false)])
  registerEndpoint(`/api/character_sheets/${SHEET_ID}/backgrounds`, () => [])
  registerEndpoint(`/api/character_sheets/${SHEET_ID}/spells`, () => [])
  registerEndpoint('/api/items', () => [])

  const sheet = () => reactive({
    id: SHEET_ID, name: 'Brom', exhaustionLevel: 0, baseAbilityScores: [], classes: [], features: [], proficiencyOverrides: [],
    abilityScoreImprovements: [], species: null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any) as any

  it('une hachette et une javeline équipées offrent une bascule Mêlée / Lancer sans rien déplier ; une arme rangée non', async () => {
    const wrapper = await mountSuspended(InventorySection, {
      props: { characterSheet: sheet() },
      global: { stubs: { UTooltip: { template: '<div><slot /></div>' } } },
    })
    await vi.waitFor(() => expect(wrapper.text()).toContain('Armes (3)'))

    const button = (label: string) => wrapper.findAll('button').filter(b => b.text() === label)
    expect(button('Mêlée')).toHaveLength(2)
    expect(button('Lancer')).toHaveLength(2)
    expect(wrapper.findAll('button').filter(b => b.text().startsWith('Attaque'))).toHaveLength(2)
    expect(wrapper.text()).not.toContain('Longue portée')

    await button('Lancer')[0]!.trigger('click')
    expect(wrapper.findAll('button').filter(b => b.text().startsWith('Attaque'))).toHaveLength(2)
    expect(wrapper.text()).toContain('Longue portée')
    expect(wrapper.text()).toContain('Ennemi à 1,50 m')
  })
})
