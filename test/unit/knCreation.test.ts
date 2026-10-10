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
  knVitalRange,
  type KnAllotments,
} from '../../shared/ker-nethalas/creation'
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

  it('remplit en texte vide l\'apparence et les objectifs', () => {
    const { appearance, personalGoals, ...rest } = validKnCreation('x')
    const parsed = knCreationSchema.parse(rest)

    expect(appearance).toBe('')
    expect(personalGoals).toBe('')
    expect(parsed).toMatchObject({ appearance: '', personalGoals: '' })
  })
})

describe('fiche construite à la création', () => {
  it('une première partie : jauges pleines, aucun équipement', () => {
    const sheet = knBuildCreatedSheet(validKnCreation('Arathos', { appearance: 'Homme, 30 ans', personalGoals: 'Overseer Overthrown' }))

    expect(sheet).toMatchObject({
      name: 'Arathos',
      appearance: 'Homme, 30 ans',
      personalGoals: 'Overseer Overthrown',
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
      kit: { weapon: 'Hache', armor: 'Cuir clouté', cookingIngredients: 4, craftingSupplies: 12, coins: 9 },
    }))

    expect(sheet.weapons).toBe('Hache')
    expect(sheet.equipment).toBe('Armure : Cuir clouté')
    expect(sheet.coins).toBe(9)
    expect(sheet.provisions).toEqual({ ...emptyKnProvisions(), torches: 1, cookingIngredients: 4, craftingSupplies: 12 })
  })

  it('n\'écrit pas de ligne d\'armure quand elle n\'est pas renseignée', () => {
    expect(knBuildCreatedSheet(validKnCreation('x', {
      kit: { weapon: 'Hache', armor: '', cookingIngredients: 1, craftingSupplies: 6, coins: 1 },
    })).equipment).toBe('')
  })
})
