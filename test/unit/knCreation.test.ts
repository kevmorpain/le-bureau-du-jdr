import { describe, it, expect } from 'vitest'
import { emptyKnProvisions } from '../../shared/ker-nethalas/camp'
import { knResistancesSchema, knSkillsSchema } from '../../shared/ker-nethalas/character'
import {
  KN_ALLOTMENT_COUNTS,
  KN_CREATION_VITAL_KEYS,
  knAllotmentIssues,
  knBuildCreatedSheet,
  knCreationResistances,
  knCreationSchema,
  knCreationSkills,
  knRollStartingKit,
  knRollStartingVital,
  knStartingKitItems,
  knVitalRange,
  type KnAllotments,
} from '../../shared/ker-nethalas/creation'
import type { KnCatalogItem } from '../../shared/ker-nethalas/items'
import { knRollStartingArmor, type KnLootContent } from '../../shared/ker-nethalas/loot'
import { KN_SKILL_KEYS } from '../../shared/ker-nethalas/skills'
import { validKnCreation } from '../fixtures/knCreation'

// Une séquence de tirages : chaque entrée est le résultat voulu d'un dé à `sides` faces.
const rolls = (...results: [sides: number, result: number][]) => {
  const queue = results.map(([sides, result]) => (result - 0.5) / sides)
  return () => {
    const next = queue.shift()
    if (next === undefined) throw new Error('plus de tirage prévu')
    return next
  }
}

const allotmentsOf = (over: KnAllotments = {}): KnAllotments => ({ ...validKnCreation('x').allotments, ...over })

describe('jauges de départ', () => {
  it('chaque jauge a pour bornes celles de ses dés : Santé D6+10, Robustesse 3D6+20, Éther D6+8, Santé mentale D6+10', () => {
    expect(knVitalRange('health')).toEqual({ min: 11, max: 16 })
    expect(knVitalRange('toughness')).toEqual({ min: 23, max: 38 })
    expect(knVitalRange('aether')).toEqual({ min: 9, max: 14 })
    expect(knVitalRange('sanity')).toEqual({ min: 11, max: 16 })
  })

  it('tire les dés et ajoute le bonus', () => {
    expect(knRollStartingVital('health', rolls([6, 4]))).toBe(14)
    expect(knRollStartingVital('toughness', rolls([6, 1], [6, 5], [6, 6]))).toBe(32)
    expect(knRollStartingVital('aether', rolls([6, 6]))).toBe(14)
  })

  it('les tirages extrêmes restent dans les bornes', () => {
    for (const vital of KN_CREATION_VITAL_KEYS) {
      const { min, max } = knVitalRange(vital)
      expect(knRollStartingVital(vital, () => 0)).toBe(min)
      expect(knRollStartingVital(vital, () => 0.999999)).toBe(max)
    }
  })
})

describe('enveloppes de compétences', () => {
  it('+60 sur une arme, +40 sur une autre, 3×30, 2×20, 3×10 : valide', () => {
    expect(knAllotmentIssues(allotmentsOf())).toEqual([])
    expect(Object.values(KN_ALLOTMENT_COUNTS).reduce((a, b) => a + b, 0)).toBe(10)
  })

  it('exige le bon nombre de compétences pour chaque enveloppe', () => {
    const missing = { ...allotmentsOf() }
    delete missing.reason

    expect(knAllotmentIssues(missing)).toEqual(['+10 : 2 compétence(s) choisie(s) sur 3'])
    expect(knAllotmentIssues(allotmentsOf({ reason: 20 }))).toEqual([
      '+20 : 3 compétence(s) choisie(s) sur 2',
      '+10 : 2 compétence(s) choisie(s) sur 3',
    ])
    expect(knAllotmentIssues({})).toHaveLength(5)
  })

  it('+60 et +40 vont à des compétences d\'arme', () => {
    expect(knAllotmentIssues(allotmentsOf({ bladedWeapons: undefined, medicine: 60, scavenge: 10 })).join(' ')).toContain('+60 : doit aller à une compétence d\'arme')
    expect(knAllotmentIssues(allotmentsOf({ bludgeoningWeapons: undefined, shaftedWeapons: 40 }))).toEqual([])
    expect(knAllotmentIssues(allotmentsOf({ bludgeoningWeapons: 60, bladedWeapons: 40 }))).toEqual([])
  })

  it('refuse une compétence inconnue ou une valeur d\'enveloppe qui n\'existe pas', () => {
    const base = validKnCreation('x')

    expect(knCreationSchema.safeParse({ ...base, allotments: { ...base.allotments, luck: 10 } }).success).toBe(false)
    expect(knCreationSchema.safeParse({ ...base, allotments: { ...base.allotments, reason: 15 } }).success).toBe(false)
  })

  it('ajoute l\'enveloppe au score de départ imprimé sur la fiche', () => {
    const skills = knCreationSkills(allotmentsOf())

    expect(skills.bladedWeapons.score).toBe(60)
    expect(skills.bludgeoningWeapons.score).toBe(40)
    expect(skills.dodge.score).toBe(40)
    expect(skills.perception.score).toBe(40)
    expect(skills.unarmedCombat.score).toBe(0)
    expect(skills.scavenge.score).toBe(10)
    expect(Object.values(skills).every(skill => skill.marked === false)).toBe(true)
    expect(Object.keys(skills)).toEqual([...KN_SKILL_KEYS])
    expect(knSkillsSchema.safeParse(skills).success).toBe(true)
  })
})

describe('résistances de départ', () => {
  it('40 dans une Résistance, 20 dans les deux autres', () => {
    expect(knCreationResistances('resolve')).toEqual({ endurance: 20, resolve: 40, spellward: 20 })
    expect(knCreationResistances('spellward')).toEqual({ endurance: 20, resolve: 20, spellward: 40 })
    expect(knResistancesSchema.safeParse(knCreationResistances('endurance')).success).toBe(true)
  })
})

describe('équipement de départ', () => {
  it('tire D10 Denrées, D10+5 Fournitures et D20 pièces', () => {
    expect(knRollStartingKit(rolls([10, 7], [10, 3], [20, 15]))).toEqual({ cookingIngredients: 7, craftingSupplies: 8, coins: 15 })
    expect(knRollStartingKit(() => 0)).toEqual({ cookingIngredients: 1, craftingSupplies: 6, coins: 1 })
    expect(knRollStartingKit(() => 0.999999)).toEqual({ cookingIngredients: 10, craftingSupplies: 15, coins: 20 })
  })
})

describe('schéma de création', () => {
  it('accepte une création valide, avec ou sans équipement de départ', () => {
    expect(knCreationSchema.safeParse(validKnCreation('Arathos')).success).toBe(true)
    expect(knCreationSchema.safeParse(validKnCreation('Arathos', {
      kit: { weapon: 'Épée longue', armor: 'Cuir', cookingIngredients: 5, craftingSupplies: 10, coins: 12 },
    })).success).toBe(true)
  })

  it('refuse une jauge hors de ses dés, une enveloppe mal répartie et des quantités hors des dés', () => {
    const base = validKnCreation('x')

    expect(knCreationSchema.safeParse({ ...base, vitals: { ...base.vitals, health: 17 } }).success).toBe(false)
    expect(knCreationSchema.safeParse({ ...base, vitals: { ...base.vitals, toughness: 22 } }).success).toBe(false)
    expect(knCreationSchema.safeParse({ ...base, allotments: { bladedWeapons: 60 } }).success).toBe(false)
    expect(knCreationSchema.safeParse({ ...base, resistanceBoost: 'luck' }).success).toBe(false)
    expect(knCreationSchema.safeParse({
      ...base,
      kit: { weapon: '', armor: '', cookingIngredients: 11, craftingSupplies: 10, coins: 12 },
    }).success).toBe(false)
    expect(knCreationSchema.safeParse({
      ...base,
      kit: { weapon: '', armor: '', cookingIngredients: 5, craftingSupplies: 5, coins: 12 },
    }).success).toBe(false)
  })

  it('remplit en vide l\'apparence, l\'entraînement et les objectifs', () => {
    const { appearance, training, goals, ...rest } = validKnCreation('x')
    const parsed = knCreationSchema.parse(rest)

    expect([appearance, training, goals]).toEqual(['', '', []])
    expect(parsed).toMatchObject({ appearance: '', training: '', goals: [] })
  })

  it('borne le texte d\'entraînement', () => {
    expect(knCreationSchema.safeParse(validKnCreation('x', { training: 'a'.repeat(2000) })).success).toBe(true)
    expect(knCreationSchema.safeParse(validKnCreation('x', { training: 'a'.repeat(2001) })).success).toBe(false)
  })
})

describe('fiche construite à la création', () => {
  it('une première partie : jauges pleines, aucun équipement', () => {
    const sheet = knBuildCreatedSheet(validKnCreation('Arathos', { appearance: 'Homme, 30 ans', training: 'Lieu fictif' }))

    expect(sheet).toMatchObject({
      name: 'Arathos',
      appearance: 'Homme, 30 ans',
      training: 'Lieu fictif',
      goalPicks: [],
      healthCurrent: 11,
      healthMax: 11,
      toughnessCurrent: 23,
      toughnessMax: 23,
      aetherCurrent: 9,
      aetherMax: 9,
      sanityCurrent: 11,
      sanityMax: 11,
      exhaustion: 0,
      weapons: '',
      equipment: '',
      coins: 0,
    })
    expect(sheet.provisions).toEqual(emptyKnProvisions())
    expect(sheet.resistances).toEqual({ endurance: 40, resolve: 20, spellward: 20 })
  })

  it('avec l\'équipement des runs suivants : Torche, Denrées, Fournitures, pièces, arme et armure', () => {
    const sheet = knBuildCreatedSheet(validKnCreation('Jera', {
      kit: { weapon: 'Hache', armor: 'Cuir clouté', cookingIngredients: 4, craftingSupplies: 12, coins: 9, items: [] },
    }))

    expect(sheet.weapons).toBe('Hache')
    expect(sheet.equipment).toBe('Armure : Cuir clouté')
    expect(sheet.coins).toBe(9)
    expect(sheet.provisions).toEqual({ ...emptyKnProvisions(), torches: 1, cookingIngredients: 4, craftingSupplies: 12 })
  })

  describe('arme et armure du kit en objets d\'inventaire', () => {
    const catalog: KnCatalogItem[] = [
      { key: 'fakeSword', name: 'Épée factice', kind: 'weapon', weight: 'normal', value: 20, weapon: { skill: 'bladedWeapons', speed: 0, damageType: 'slashing', traits: [] } },
      { key: 'fakeMail', name: 'Maille factice', kind: 'torso', weight: 'normal', value: 150, protection: 2, integrity: 8 },
      { key: 'fakeHelm', name: 'Casque factice', kind: 'helmet', weight: 'normal', value: 40, protection: 1, integrity: 6 },
    ]

    it('l\'arme se tient en main et l\'armure se porte, neuves : Intégrité au maximum', () => {
      const items = knStartingKitItems(catalog, { weapon: 'fakeSword', armor: 'fakeMail' })

      expect(items).toMatchObject([
        { id: 'i1', ref: 'fakeSword', place: 'mainHand' },
        { id: 'i2', ref: 'fakeMail', place: 'armor', integrity: { max: 8, current: 8 } },
      ])
      expect(knStartingKitItems(catalog, { armor: 'fakeHelm' })[0]).toMatchObject({ place: 'head' })
      expect(knStartingKitItems(catalog, { weapon: 'inconnu', armor: null })).toEqual([])
    })

    it('la fiche reçoit les objets, et le texte libre du kit n\'est alors pas repris', () => {
      const items = knStartingKitItems(catalog, { weapon: 'fakeSword', armor: 'fakeMail' })
      const sheet = knBuildCreatedSheet(validKnCreation('Jera', {
        kit: { weapon: 'Épée factice', armor: 'Maille factice', cookingIngredients: 4, craftingSupplies: 12, coins: 9, items },
      }))

      expect(sheet.inventory).toEqual(items)
      expect(sheet.weapons).toBe('')
      expect(sheet.equipment).toBe('')
    })

    it('le texte de l\'armure reste quand seule l\'arme est un objet, et le kit refuse plus de deux objets', () => {
      const items = knStartingKitItems(catalog, { weapon: 'fakeSword' })
      const sheet = knBuildCreatedSheet(validKnCreation('Jera', {
        kit: { weapon: 'Épée factice', armor: 'Cuir', cookingIngredients: 4, craftingSupplies: 12, coins: 9, items },
      }))
      const three = [...knStartingKitItems(catalog, { weapon: 'fakeSword', armor: 'fakeMail' }), { id: 'i3', name: 'x', kind: 'gear' as const, weight: 'normal' as const, quantity: 1, place: 'bag' as const }]

      expect(sheet).toMatchObject({ weapons: '', equipment: 'Armure : Cuir' })
      expect(knCreationSchema.safeParse(validKnCreation('x', {
        kit: { weapon: '', armor: '', cookingIngredients: 4, craftingSupplies: 12, coins: 9, items: three },
      })).success).toBe(false)
    })

    it('l\'armure tirée relance tant que le tirage n\'est pas une pièce du catalogue', () => {
      const loot: KnLootContent = {
        armor: { die: 10, entries: [{ min: 1, max: 5, text: 'Magique', drop: { kind: 'magic', item: 'armor' } }, { min: 6, max: 10, text: 'Casque', drop: { kind: 'item', ref: 'fakeHelm' } }] },
      }

      expect(knRollStartingArmor(loot, rolls([10, 2], [10, 9]))).toBe('fakeHelm')
      expect(knRollStartingArmor({}, () => 0)).toBeUndefined()
    })
  })

  it('n\'écrit pas de ligne d\'armure quand elle n\'est pas renseignée', () => {
    expect(knBuildCreatedSheet(validKnCreation('x', {
      kit: { weapon: 'Hache', armor: '', cookingIngredients: 1, craftingSupplies: 6, coins: 1, items: [] },
    })).equipment).toBe('')
  })
})
