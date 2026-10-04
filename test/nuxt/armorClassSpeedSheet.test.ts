import { describe, it, expect } from 'vitest'
import type { Effect } from '../../server/db/schema/effects'
import { BARBARIAN_QUICK_MOVEMENT, BARBARIAN_UNARMORED_DEFENSE } from '../../server/db/seeds/data/barbare'
import { MONK_UNARMORED_DEFENSE, MONK_UNARMORED_MOVEMENT } from '../../server/db/seeds/data/moine'
import { fixed } from '../../shared/utils/formula'
import { baseScores, classFeature, inventoryEntry as entry, mountSheet as mount } from './fixtures/mountSheet'

// CA sans armure (Barbare, Moine) et vitesse (Déplacement rapide / sans armure, don Mobile, objets, Force requise
// des armures lourdes, Nain), lues par la fiche. Passe par useCharacterSheet pour garder tout le câblage.

const BARBARIAN = 1
const MONK = 2

const barbarianFeatures = [
  classFeature(1, 'Défense sans armure', BARBARIAN, 1, [{ type: 'unarmored_defense', value: BARBARIAN_UNARMORED_DEFENSE }]),
  classFeature(2, 'Déplacement rapide', BARBARIAN, 5, [{ type: 'speed_bonus', value: BARBARIAN_QUICK_MOVEMENT }]),
]
const monkFeatures = [
  classFeature(3, 'Défense sans armure', MONK, 1, [{ type: 'unarmored_defense', value: MONK_UNARMORED_DEFENSE }]),
  classFeature(4, 'Déplacement sans armure', MONK, 2, [{ type: 'speed_bonus', value: MONK_UNARMORED_MOVEMENT }]),
]
const chainMail = { armor_type: 'heavy', base_ac: 16, dex_limit: 0, strength_requirement: 13, stealth_disadvantage: true }
const shield = { armor_type: 'shield', base_ac: 2, dex_limit: null }
const dwarfSpeed: Effect[] = [
  { type: 'walking_speed', value: 7.5 },
  { type: 'equipment_penalty', value: { penalty: 'speed', armor_type: 'heavy', modifier: 'none', override: true } },
]

describe('fiche — Défense sans armure', () => {
  it('Barbare DEX 14 CON 16 : 10 + DEX +2 + CON +3 = 15, 17 avec un bouclier', async () => {
    const scenario = { scores: baseScores(14, 14, 16, 10), classes: [{ classId: BARBARIAN, level: 5 }], features: barbarianFeatures }
    const s = await mount(scenario)
    expect(s.armorClass.value.total).toBe(15)
    expect(s.armorClass.value.detail).toBe('10 + DEX +2 + CON +3')

    const withShield = await mount({ ...scenario, worn: id => [entry(id, 1, 'Bouclier', 'armor', shield)] })
    expect(withShield.armorClass.value.total).toBe(17)
  })

  it('Moine DEX 16 SAG 14 : 10 + DEX +3 + SAG +2 = 15 ; un bouclier suspend la capacité', async () => {
    const scenario = { scores: baseScores(10, 16, 10, 14), classes: [{ classId: MONK, level: 3 }], features: monkFeatures }
    expect((await mount(scenario)).armorClass.value.total).toBe(15)

    const withShield = await mount({ ...scenario, worn: id => [entry(id, 2, 'Bouclier', 'armor', shield)] })
    expect(withShield.armorClass.value.total).toBe(15)
    expect(withShield.armorClass.value.detail).toBe('10 + DEX +3 + bouclier +2')
  })

  it('en armure de corps, la Défense sans armure ne joue pas', async () => {
    const s = await mount({
      scores: baseScores(14, 14, 16, 10),
      classes: [{ classId: BARBARIAN, level: 5 }],
      features: barbarianFeatures,
      worn: id => [entry(id, 3, 'Cotte de mailles', 'armor', chainMail)],
    })
    expect(s.armorClass.value.total).toBe(16)
  })
})

describe('fiche — vitesse', () => {
  it('Barbare niveau 5 : 9 + 3 m, perdus en armure lourde', async () => {
    const scenario = { scores: baseScores(16, 14, 16, 10), classes: [{ classId: BARBARIAN, level: 5 }], features: barbarianFeatures }
    expect((await mount(scenario)).effectiveSpeed.value).toBe(12)

    const armored = await mount({ ...scenario, worn: id => [entry(id, 4, 'Cotte de mailles', 'armor', chainMail)] })
    expect(armored.effectiveSpeed.value).toBe(9)
  })

  it('Moine niveau 6 : 9 + 4,5 m, perdus avec un bouclier', async () => {
    const scenario = { scores: baseScores(10, 16, 10, 14), classes: [{ classId: MONK, level: 6 }], features: monkFeatures }
    const s = await mount(scenario)
    expect(s.effectiveSpeed.value).toBe(13.5)
    expect(s.speedDetail.value).toBe('9 m +4.5 m Déplacement sans armure')

    const withShield = await mount({ ...scenario, worn: id => [entry(id, 5, 'Bouclier', 'armor', shield)] })
    expect(withShield.effectiveSpeed.value).toBe(9)
  })

  it('multiclasse : le bonus du Moine se lit au niveau de Moine, pas à celui de la classe principale', async () => {
    const s = await mount({
      scores: baseScores(10, 16, 10, 14),
      classes: [{ classId: BARBARIAN, level: 9 }, { classId: MONK, level: 2 }],
      features: [...barbarianFeatures, ...monkFeatures],
    })
    expect(s.effectiveSpeed.value).toBe(9 + 3 + 3)
  })

  it('Force insuffisante en cotte de mailles : -3 m et avertissement ; Force suffisante : rien', async () => {
    const worn = (id: number) => [entry(id, 6, 'Cotte de mailles', 'armor', chainMail)]
    const weak = await mount({ scores: baseScores(12, 10, 10, 10), worn })
    expect(weak.effectiveSpeed.value).toBe(6)
    expect(weak.speedModifiers.value).toEqual(['Cotte de mailles : Force 13 requise (vitesse -3 m)'])

    const strong = await mount({ scores: baseScores(13, 10, 10, 10), worn })
    expect(strong.effectiveSpeed.value).toBe(9)
    expect(strong.speedModifiers.value).toEqual([])
  })

  it('Nain : la cotte de mailles ne réduit pas la vitesse malgré une Force de 8', async () => {
    const s = await mount({
      scores: baseScores(8, 10, 10, 10),
      speciesEffects: dwarfSpeed,
      worn: id => [entry(id, 7, 'Cotte de mailles', 'armor', chainMail)],
    })
    expect(s.effectiveSpeed.value).toBe(9)
    expect(s.speedModifiers.value).toEqual([])
  })

  it('un don à bonus de vitesse (Mobile) s\'ajoute à la vitesse de base ; le walking_speed d\'espèce n\'est jamais additionné', async () => {
    const s = await mount({
      scores: baseScores(10, 10, 10, 10),
      features: [classFeature(8, 'Mobile', 0, 1, [{ type: 'speed_bonus', value: { amount: fixed(3) } }], 'feat')],
      speciesEffects: [{ type: 'walking_speed', value: 9 }],
    })
    expect(s.effectiveSpeed.value).toBe(12)
  })

  it('vitesses de nage, d\'escalade et de creusement d\'un objet équipé', async () => {
    const s = await mount({
      scores: baseScores(10, 10, 10, 10),
      worn: id => [entry(id, 9, 'Anneau de nage', 'equipment', {}, [{ type: 'swimming_speed', value: 12 }, { type: 'climbing_speed', value: 6 }])],
    })
    expect(s.swimmingSpeed.value).toBe(12)
    expect(s.climbingSpeed.value).toBe(6)
    expect(s.burrowingSpeed.value).toBe(0)
    expect(s.flyingSpeed.value).toBe(0)
  })

  it('un bonus de vitesse d\'objet s\'ajoute à la marche', async () => {
    const s = await mount({
      scores: baseScores(10, 10, 10, 10),
      worn: id => [entry(id, 10, 'Bottes de célérité', 'equipment', {}, [{ type: 'speed_bonus', value: { amount: fixed(6) } }])],
    })
    expect(s.effectiveSpeed.value).toBe(15)
  })
})
