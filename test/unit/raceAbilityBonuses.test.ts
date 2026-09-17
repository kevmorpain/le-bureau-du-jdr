import { describe, it, expect } from 'vitest'
import { chosenRaceAbilityBonuses } from '../../app/utils/raceAbilityBonuses'

const EMPTY = {
  raceId: null as string | null,
  isVariantHuman: false,
  halfElfBonuses: [],
  variantHumanBonuses: [],
  fairyAsiBonuses: {},
} satisfies Parameters<typeof chosenRaceAbilityBonuses>[0]

describe('chosenRaceAbilityBonuses (bonus d\'espèce au choix → scores stockés)', () => {
  it('ne rend rien pour une espèce à bonus fixes (ils viennent des effets)', () => {
    expect(chosenRaceAbilityBonuses({ ...EMPTY, raceId: 'dwarf' })).toEqual({})
    expect(chosenRaceAbilityBonuses({ ...EMPTY, raceId: null })).toEqual({})
  })

  it('Demi-elfe : les deux +1 au choix (le +2 Cha reste un effet d\'espèce)', () => {
    expect(chosenRaceAbilityBonuses({
      ...EMPTY,
      raceId: 'half-elf',
      halfElfBonuses: ['dex', 'con'],
    })).toEqual({ dex: 1, con: 1 })
  })

  it('Humain : rien en version de base, les +1 au choix en variante', () => {
    expect(chosenRaceAbilityBonuses({
      ...EMPTY,
      raceId: 'human',
      variantHumanBonuses: ['str', 'cha'],
    })).toEqual({})

    expect(chosenRaceAbilityBonuses({
      ...EMPTY,
      raceId: 'human',
      isVariantHuman: true,
      variantHumanBonuses: ['str', 'cha'],
    })).toEqual({ str: 1, cha: 1 })
  })

  it('Fadette : la répartition flexible, +2/+1 comme +1/+1/+1', () => {
    expect(chosenRaceAbilityBonuses({
      ...EMPTY,
      raceId: 'fairy',
      fairyAsiBonuses: { cha: 2, dex: 1 },
    })).toEqual({ cha: 2, dex: 1 })

    expect(chosenRaceAbilityBonuses({
      ...EMPTY,
      raceId: 'fairy',
      fairyAsiBonuses: { cha: 1, dex: 1, con: 1 },
    })).toEqual({ cha: 1, dex: 1, con: 1 })
  })

  it('Fadette : les caractéristiques à 0 ne créent pas de clé', () => {
    expect(chosenRaceAbilityBonuses({
      ...EMPTY,
      raceId: 'fairy',
      fairyAsiBonuses: { cha: 2, dex: 1, str: 0, wis: 0 },
    })).toEqual({ cha: 2, dex: 1 })
  })

  it('les bonus au choix d\'une AUTRE espèce sont ignorés (changement d\'espèce en cours de builder)', () => {
    expect(chosenRaceAbilityBonuses({
      ...EMPTY,
      raceId: 'fairy',
      halfElfBonuses: ['str', 'wis'],
      variantHumanBonuses: ['int'],
      fairyAsiBonuses: { cha: 2, dex: 1 },
    })).toEqual({ cha: 2, dex: 1 })
  })
})
