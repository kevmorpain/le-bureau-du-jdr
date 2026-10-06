import { describe, it, expect } from 'vitest'
import {
  createKnCharacterSchema,
  defaultKnResistances,
  defaultKnSkills,
  knResistancesSchema,
  knSkillsSchema,
  updateKnCharacterSchema,
} from '../../shared/ker-nethalas/character'
import { KN_RESISTANCE_KEYS, KN_SKILL_KEYS } from '../../shared/ker-nethalas/skills'

// Valeurs relues sur la fiche vierge et dans Gravebound p. 19-20 : scores de départ entre parenthèses
// (Acrobatics 10, Athletics 10, Dodge 10, Perception 20), Résistances à 20 avant le +20 au choix.

describe('valeurs par défaut d\'un survivant', () => {
  it('reprend les scores de départ imprimés sur la fiche', () => {
    const skills = defaultKnSkills()

    expect(Object.keys(skills)).toEqual([...KN_SKILL_KEYS])
    expect(skills.acrobatics.score).toBe(10)
    expect(skills.athletics.score).toBe(10)
    expect(skills.dodge.score).toBe(10)
    expect(skills.perception.score).toBe(20)
    expect(skills.unarmedCombat.score).toBe(0)
    expect(Object.values(skills).every(s => s.marked === false)).toBe(true)
  })

  it('démarre les trois Résistances à 20', () => {
    const resistances = defaultKnResistances()

    expect(Object.keys(resistances)).toEqual([...KN_RESISTANCE_KEYS])
    expect(Object.values(resistances)).toEqual([20, 20, 20])
  })

  it('produit des valeurs que les schémas acceptent', () => {
    expect(knSkillsSchema.safeParse(defaultKnSkills()).success).toBe(true)
    expect(knResistancesSchema.safeParse(defaultKnResistances()).success).toBe(true)
  })
})

describe('bornes des schémas', () => {
  it('plafonne les Résistances à 80 mais laisse les compétences dépasser 80', () => {
    const skills = defaultKnSkills()
    skills.dodge.score = 95

    expect(knSkillsSchema.safeParse(skills).success).toBe(true)
    expect(knResistancesSchema.safeParse({ ...defaultKnResistances(), endurance: 80 }).success).toBe(true)
    expect(knResistancesSchema.safeParse({ ...defaultKnResistances(), endurance: 81 }).success).toBe(false)
  })

  it('refuse un score de compétence négatif ou décimal', () => {
    const negative = defaultKnSkills()
    negative.dodge.score = -1
    const decimal = defaultKnSkills()
    decimal.dodge.score = 10.5

    expect(knSkillsSchema.safeParse(negative).success).toBe(false)
    expect(knSkillsSchema.safeParse(decimal).success).toBe(false)
  })

  it('exige un nom non vide à la création, espaces ignorés', () => {
    expect(createKnCharacterSchema.safeParse({ name: 'Arathos' }).success).toBe(true)
    expect(createKnCharacterSchema.safeParse({ name: '   ' }).success).toBe(false)
    expect(createKnCharacterSchema.parse({ name: '  Arathos  ' }).name).toBe('Arathos')
  })

  it('accepte une mise à jour partielle, y compris vide', () => {
    expect(updateKnCharacterSchema.safeParse({}).success).toBe(true)
    expect(updateKnCharacterSchema.safeParse({ healthCurrent: 12 }).success).toBe(true)
  })

  it('refuse les jauges négatives, un nom vide et trop de compétences supplémentaires', () => {
    expect(updateKnCharacterSchema.safeParse({ healthCurrent: -1 }).success).toBe(false)
    expect(updateKnCharacterSchema.safeParse({ name: ' ' }).success).toBe(false)

    const extra = { name: 'Magie', score: 10, marked: false }
    expect(updateKnCharacterSchema.safeParse({ extraSkills: Array(5).fill(extra) }).success).toBe(true)
    expect(updateKnCharacterSchema.safeParse({ extraSkills: Array(6).fill(extra) }).success).toBe(false)
  })

  it('autorise un modificateur de dégâts négatif', () => {
    expect(updateKnCharacterSchema.safeParse({ damageModifier: -2 }).success).toBe(true)
  })
})
