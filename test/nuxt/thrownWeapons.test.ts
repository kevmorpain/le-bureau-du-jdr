import { describe, it, expect } from 'vitest'
import type { Effect } from '../../server/db/schema/effects'
import { resolveRollMode } from '../../shared/rules/rolls'
import { fixed } from '../../shared/utils/formula'
import { baseScores, classFeature, inventoryEntry as entry, mountSheet as mount } from './fixtures/mountSheet'

// Une arme de corps à corps à lancer garde son attaque de mêlée et gagne un lancer, qui est une attaque à distance :
// même caractéristique, mais ni Rage, ni Duel, ni Archerie. La distance de la cible est un choix du joueur.

const FIGHTER = 3

const handaxe = { weapon_category: 'simple_melee', weapon_properties: ['light', 'thrown'], damage_dice: '1d6', damage_type: 'slashing', range: { normal: 6, long: 18 } }
const dagger = { weapon_category: 'simple_melee', weapon_properties: ['finesse', 'light', 'thrown'], damage_dice: '1d4', damage_type: 'piercing', range: { normal: 6, long: 18 } }
const dart = { weapon_category: 'simple_ranged', weapon_properties: ['finesse', 'thrown'], damage_dice: '1d4', damage_type: 'piercing', range: { normal: 6, long: 18 } }
const shortbow = { weapon_category: 'simple_ranged', weapon_properties: ['ammunition', 'two_handed'], damage_dice: '1d6', damage_type: 'piercing', range: { normal: 24, long: 96 } }
const club = { weapon_category: 'simple_melee', weapon_properties: ['light'], damage_dice: '1d4', damage_type: 'bludgeoning' }

const simpleWeapons: Effect[] = [{ type: 'weapon_proficiency', value: 'simple_weapons' }]
const bracers: Effect[] = [{ type: 'weapon_damage_bonus', value: { amount: 2, weapons: 'ranged' } }]

const weapons = (id: number) => [
  entry(id, 1, 'Hachette', 'weapon', handaxe),
  entry(id, 2, 'Dague', 'weapon', dagger),
  entry(id, 3, 'Fléchette', 'weapon', dart),
  entry(id, 4, 'Arc court', 'weapon', shortbow),
  entry(id, 5, 'Gourdin', 'weapon', club),
]

const statsOf = (s: Awaited<ReturnType<typeof mount>>, name: string) => s.equippedWeaponStats.value.find(w => w.name === name)!
const modeOf = (sources: Parameters<typeof resolveRollMode>[0]) => resolveRollMode(sources).mode

describe('fiche — armes de lancer', () => {
  const scores = baseScores(16, 10, 10, 10)
  const scenario = { scores, classes: [{ classId: FIGHTER, level: 3 }], speciesEffects: simpleWeapons, worn: weapons }

  it('seule une arme de corps à corps à lancer offre un lancer', async () => {
    const s = await mount(scenario)
    expect(statsOf(s, 'Hachette').thrown).not.toBeNull()
    expect(statsOf(s, 'Dague').thrown).not.toBeNull()
    expect(statsOf(s, 'Fléchette').thrown).toBeNull()
    expect(statsOf(s, 'Arc court').thrown).toBeNull()
    expect(statsOf(s, 'Gourdin').thrown).toBeNull()
  })

  it('le lancer garde la caractéristique et la maîtrise du corps à corps', async () => {
    const s = await mount(scenario)
    const axe = statsOf(s, 'Hachette')
    expect(axe.attackBonus).toBe(3 + 2)
    expect(axe.thrown).toMatchObject({ attackBonus: 3 + 2, damageBonus: 3, damageDice: '1d6' })
  })

  it('arme à finesse : le lancer prend la meilleure de la Force et de la Dextérité', async () => {
    const s = await mount({ ...scenario, scores: baseScores(10, 16, 10, 10) })
    expect(statsOf(s, 'Dague').thrown).toMatchObject({ attackBonus: 3 + 2, damageBonus: 3 })
    expect(statsOf(s, 'Hachette').thrown).toMatchObject({ attackBonus: 0 + 2, damageBonus: 0 })
  })

  it('un bonus « à distance » vaut pour le lancer, pas pour l\'attaque de mêlée', async () => {
    const s = await mount({
      ...scenario,
      worn: id => [...weapons(id), entry(id, 6, 'Bracelets d\'archerie', 'equipment', {}, bracers, { attuned: true, requiresAttunement: true })],
    })
    const axe = statsOf(s, 'Hachette')
    expect(axe.damageBonus).toBe(3)
    expect(axe.thrown!.damageBonus).toBe(3 + 2)
    expect(axe.thrown!.damageParts).toEqual([{ label: 'Bracelets d\'archerie', amount: 2 }])
  })

  it('le bonus de dégâts de corps à corps à la Force (Rage) ne vaut pas pour le lancer', async () => {
    const rage = classFeature(1, 'Rage', FIGHTER, 1, [{ type: 'melee_strength_damage_bonus', value: { amount: fixed(2) } }])
    const s = await mount({ ...scenario, features: [rage] })
    const axe = statsOf(s, 'Hachette')
    expect(axe.damageBonus).toBe(3 + 2)
    expect(axe.thrown!.damageBonus).toBe(3)
  })

  it('les armes qui frappent à distance portent un choix de distance, pas les autres', async () => {
    const s = await mount(scenario)
    for (const name of ['Hachette', 'Dague', 'Fléchette', 'Arc court']) {
      expect(statsOf(s, name).rangeChoice, name).toEqual({ long: false, adjacent: false })
    }
    expect(statsOf(s, 'Gourdin').rangeChoice).toBeNull()
  })

  it('longue portée : désavantage au lancer et au tir, jamais à la frappe de mêlée de la même arme', async () => {
    const s = await mount(scenario)
    s.setRangeChoice(1, { long: true })
    s.setRangeChoice(4, { long: true })
    const axe = statsOf(s, 'Hachette')
    expect(modeOf(axe.thrown!.attackRollSources)).toBe('disadvantage')
    expect(axe.thrown!.attackRollSources.map(r => r.label)).toEqual(['Longue portée'])
    expect(axe.attackRollSources).toEqual([])
    expect(modeOf(statsOf(s, 'Arc court').attackRollSources)).toBe('disadvantage')
    expect(statsOf(s, 'Dague').thrown!.attackRollSources).toEqual([])
  })

  it('ennemi à 1,50 m : désavantage, et les deux choix ensemble n\'en font toujours qu\'un', async () => {
    const s = await mount(scenario)
    s.setRangeChoice(3, { adjacent: true })
    expect(statsOf(s, 'Fléchette').attackRollSources.map(r => r.label)).toEqual(['Ennemi à 1,50 m'])
    s.setRangeChoice(3, { long: true })
    const sources = statsOf(s, 'Fléchette').attackRollSources
    expect(sources.map(r => r.label)).toEqual(['Longue portée', 'Ennemi à 1,50 m'])
    expect(modeOf(sources)).toBe('disadvantage')
  })

  it('une arme à lancer s\'ouvre en mêlée ; la bascule en lancer ne change aucun chiffre', async () => {
    const s = await mount(scenario)
    const before = { ...statsOf(s, 'Hachette') }
    expect(before.throwing).toBe(false)

    s.setThrowing(1, true)
    const after = statsOf(s, 'Hachette')
    expect(after.throwing).toBe(true)
    expect([after.attackBonus, after.damageBonus, after.thrown]).toEqual([before.attackBonus, before.damageBonus, before.thrown])
    expect(statsOf(s, 'Dague').throwing).toBe(false)

    s.setThrowing(1, false)
    expect(statsOf(s, 'Hachette').throwing).toBe(false)
  })

  it('une arme qui ne se lance pas ne bascule jamais en lancer, même si l\'état le dit', async () => {
    const s = await mount(scenario)
    s.setThrowing(4, true)
    s.setThrowing(5, true)
    expect(statsOf(s, 'Arc court').throwing).toBe(false)
    expect(statsOf(s, 'Fléchette').throwing).toBe(false)
    expect(statsOf(s, 'Gourdin').throwing).toBe(false)
  })

  it('décocher le choix lève le désavantage', async () => {
    const s = await mount(scenario)
    s.setRangeChoice(4, { long: true })
    s.setRangeChoice(4, { long: false })
    expect(statsOf(s, 'Arc court').attackRollSources).toEqual([])
  })
})
