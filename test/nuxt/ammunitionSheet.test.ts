import { describe, it, expect } from 'vitest'
import { registerEndpoint } from '@nuxt/test-utils/runtime'
import type { Effect } from '../../server/db/schema/effects'
import { baseScores, inventoryEntry as entry, mountSheet as mount } from './fixtures/mountSheet'

// Une munition est consommée à chaque attaque avec une arme à munitions ; sans munition du bon type, l'arme ne tire pas.

const FIGHTER = 3

const shortbow = { weapon_category: 'simple_ranged', weapon_properties: ['ammunition', 'two_handed'], damage_dice: '1d6', damage_type: 'piercing', range: { normal: 24, long: 96 }, ammunition_type: 'arrow' }
const customBow = { ...shortbow, ammunition_type: undefined }
const simpleWeapons: Effect[] = [{ type: 'weapon_proficiency', value: 'simple_weapons' }]

const ammunition = (id: number, entryId: number, name: string, type: string, quantity: number) =>
  ({ ...entry(id, entryId, name, 'equipment', { category: 'Munition', ammunition_type: type }), quantity, equipped: false })

const BOW = 1
const ARROWS = 2

const scenario = (worn: NonNullable<Parameters<typeof mount>[0]['worn']>, preferences: { ammunition?: boolean } | null = { ammunition: true }) => ({
  scores: baseScores(10, 16, 10, 10),
  classes: [{ classId: FIGHTER, level: 3 }],
  speciesEffects: simpleWeapons,
  preferences,
  worn: (id: number) => {
    registerEndpoint(`/api/character_sheets/${id}/inventory/${ARROWS}`, { method: 'PUT', handler: () => ({}) })
    return worn(id)
  },
})

describe('fiche — munitions', () => {
  it('l\'arme dit combien de munitions lui restent', async () => {
    const s = await mount(scenario(id => [entry(id, BOW, 'Arc court', 'weapon', shortbow), ammunition(id, ARROWS, 'Flèche', 'arrow', 12)]))
    expect(s.equippedWeaponStats.value[0]!.ammunition).toEqual({ type: 'arrow', label: 'flèches', available: 12 })
  })

  it('chaque attaque consomme une munition, puis l\'arme ne tire plus', async () => {
    const s = await mount(scenario(id => [entry(id, BOW, 'Arc court', 'weapon', shortbow), ammunition(id, ARROWS, 'Flèche', 'arrow', 2)]))
    const quantity = () => s.inventory.value.find(e => e.id === ARROWS)!.quantity

    expect(s.spendAmmunition(BOW)).toBe(true)
    expect(quantity()).toBe(1)
    expect(s.spendAmmunition(BOW)).toBe(true)
    expect(quantity()).toBe(0)
    expect(s.spendAmmunition(BOW)).toBe(false)
    expect(quantity()).toBe(0)
    expect(s.equippedWeaponStats.value[0]!.warnings).toContain('Plus de flèches : impossible de tirer')
  })

  it('une munition d\'un autre type ne se tire pas avec cet arc', async () => {
    const s = await mount(scenario(id => [entry(id, BOW, 'Arc court', 'weapon', shortbow), ammunition(id, ARROWS, 'Carreau d\'arbalète', 'bolt', 20)]))
    expect(s.equippedWeaponStats.value[0]!.ammunition!.available).toBe(0)
    expect(s.spendAmmunition(BOW)).toBe(false)
  })

  it('sans inventaire de munitions, l\'arme ne tire pas non plus', async () => {
    const s = await mount(scenario(id => [entry(id, BOW, 'Arc court', 'weapon', shortbow)]))
    expect(s.spendAmmunition(BOW)).toBe(false)
  })

  it('sans réglage posé, les munitions ne sont pas décomptées : l\'arme tire sans limite et l\'inventaire ne bouge pas', async () => {
    const worn = (id: number) => [entry(id, BOW, 'Arc court', 'weapon', shortbow), ammunition(id, ARROWS, 'Flèche', 'arrow', 3)]
    const s = await mount(scenario(worn, null))
    expect(s.equippedWeaponStats.value[0]!.ammunition).toBeNull()
    expect(s.spendAmmunition(BOW)).toBe(true)
    expect(s.inventory.value.find(e => e.id === ARROWS)!.quantity).toBe(3)
  })

  it('le compte qui active le réglage décompte, sauf la fiche qui le désactive', async () => {
    const worn = (id: number) => [entry(id, BOW, 'Arc court', 'weapon', shortbow), ammunition(id, ARROWS, 'Flèche', 'arrow', 3)]
    const account = await mount({ ...scenario(worn, null), ownerPreferences: { ammunition: true } })
    expect(account.equippedWeaponStats.value[0]!.ammunition).toMatchObject({ available: 3 })
    const sheet = await mount({ ...scenario(worn, { ammunition: false }), ownerPreferences: { ammunition: true } })
    expect(sheet.equippedWeaponStats.value[0]!.ammunition).toBeNull()
  })

  it('une arme sur mesure sans type de munition n\'est pas suivie', async () => {
    const s = await mount(scenario(id => [entry(id, BOW, 'Arc elfique', 'weapon', customBow)]))
    expect(s.equippedWeaponStats.value[0]!.ammunition).toBeNull()
    expect(s.spendAmmunition(BOW)).toBe(true)
  })

  it('une arme sans propriété munitions n\'en consomme pas', async () => {
    const dagger = { weapon_category: 'simple_melee', weapon_properties: ['finesse', 'light', 'thrown'], damage_dice: '1d4', damage_type: 'piercing', range: { normal: 6, long: 18 } }
    const s = await mount(scenario(id => [entry(id, BOW, 'Dague', 'weapon', dagger), ammunition(id, ARROWS, 'Flèche', 'arrow', 5)]))
    expect(s.equippedWeaponStats.value[0]!.ammunition).toBeNull()
    expect(s.spendAmmunition(BOW)).toBe(true)
    expect(s.inventory.value.find(e => e.id === ARROWS)!.quantity).toBe(5)
  })
})
