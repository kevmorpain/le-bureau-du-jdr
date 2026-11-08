import { describe, it, expect } from 'vitest'
import { computeAbilityScores } from '../../shared/rules/abilityScores'
import { featureEffectsOf } from '../../shared/rules/characterEffects'
import { boonsData } from '../../server/db/seeds/data/boons'

// Faveurs permanentes : les six manuels et tomes, +2 à une caractéristique et à son maximum.

const sheetWith = (...names: string[]) => ({
  classes: [],
  features: names.map(name => ({
    feature: { featureType: 'boon', featureEffects: boonsData.find(b => b.name === name)!.effects.map(effect => ({ effect })) },
  })),
})

const scores = (base: Record<string, number>, ...names: string[]) => computeAbilityScores({
  base,
  speciesEffects: [],
  featureEffects: featureEffectsOf(sheetWith(...names)),
  asiEffects: [],
  activeEffects: [],
})

describe('Faveurs permanentes — données du seed', () => {
  it('six faveurs, une par caractéristique, +2 au score et +2 à son maximum', () => {
    expect(boonsData).toHaveLength(6)
    expect(new Set(boonsData.map(b => b.name)).size).toBe(6)

    const abilities = boonsData.map((b) => {
      const increase = b.effects.find(e => e.type === 'ability_increase')
      const maximum = b.effects.find(e => e.type === 'ability_max_increase')
      expect(b.effects).toHaveLength(2)
      expect(increase).toMatchObject({ value: { amount: 2 } })
      expect(maximum).toMatchObject({ value: { amount: 2 } })
      expect(maximum!.value).toEqual(increase!.value)
      return (increase!.value as { ability: string }).ability
    })
    expect([...abilities].sort()).toEqual(['cha', 'con', 'dex', 'int', 'str', 'wis'])
  })
})

describe('Faveurs permanentes — lues comme un don', () => {
  it('leurs effets arrivent aux caractéristiques sans condition de niveau ni de classe', () => {
    expect(featureEffectsOf(sheetWith('Manuel de vitalité'))).toHaveLength(2)
  })

  it('Manuel de vitalité : Constitution 20 → 22, maximum 22', () => {
    expect(scores({ con: 20 }, 'Manuel de vitalité').con).toMatchObject({ maximum: 22, total: 22 })
  })

  it('Manuel de vitalité : Constitution 14 → 16, le maximum relevé ne change rien sous 20', () => {
    expect(scores({ con: 14 }, 'Manuel de vitalité').con).toMatchObject({ maximum: 22, total: 16 })
  })

  it('plusieurs faveurs de caractéristiques différentes s\'additionnent chacune sur la sienne', () => {
    const result = scores({ str: 19, int: 19 }, 'Manuel d\'exercices physiques', 'Traité de perspicacité')
    expect(result.str).toMatchObject({ maximum: 22, total: 21 })
    expect(result.int).toMatchObject({ maximum: 22, total: 21 })
    expect(result.con).toMatchObject({ maximum: 20, total: 10 })
  })
})
