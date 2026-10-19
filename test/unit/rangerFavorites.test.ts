import { describe, it, expect } from 'vitest'
import { choicesGainedAtLevelUp, isPickChoice, resolveChoices, type CatalogProgression } from '../../shared/rules/resolve'
import { FAVORED_ENEMIES, FAVORED_TERRAINS } from '../../shared/rules/rangerFavorites'
import { DRUID_TERRAINS } from '../../server/db/seeds/data/alwaysPreparedSpells'
import { FAVORED_ENEMY_COUNT, FAVORED_TERRAIN_COUNT, rodeurFeatures } from '../../server/db/seeds/data/rodeur'
import { choiceTitle } from '../../app/utils/choiceTitle'

// Le Rôdeur choisit un ennemi juré et un terrain favori dès le niveau 1, puis un de plus aux niveaux 6 et 14 (ennemis)
// ou 6 et 10 (terrains). Un point de choix qui grandit ne revient au level-up que pour son surplus.

const RANGER = 3
const FIGHTER = 4

const enemy: CatalogProgression = {
  progressionId: 1,
  ownerClassId: RANGER,
  ownerLevelRequired: 1,
  kind: 'favored_enemy',
  count: FAVORED_ENEMY_COUNT,
  optionSource: { type: 'enum', values: [...FAVORED_ENEMIES] },
  replaceable: false,
  options: FAVORED_ENEMIES.map(value => ({ value })),
}
const terrain: CatalogProgression = {
  progressionId: 2,
  ownerClassId: RANGER,
  ownerLevelRequired: 1,
  kind: 'terrain',
  count: FAVORED_TERRAIN_COUNT,
  optionSource: { type: 'enum', values: [...FAVORED_TERRAINS] },
  replaceable: false,
  options: FAVORED_TERRAINS.map(value => ({ value })),
}
const catalog = { progressions: [enemy, terrain] }

const countsAt = (level: number) => Object.fromEntries(
  resolveChoices({ classLevels: { [RANGER]: level } }, catalog).choices.map(c => [c.kind, c.count]),
)
const gained = (fromLevel: number, toLevel: number, over: Partial<Parameters<typeof choicesGainedAtLevelUp>[1]> = {}) =>
  choicesGainedAtLevelUp(catalog, { classId: RANGER, fromLevel, toLevel, mainClassId: RANGER, ...over })
    .map(c => `${c.kind}:${c.count}/${c.remaining}`)

describe('Rôdeur — nombre d\'ennemis jurés et de terrains favoris par niveau', () => {
  it('un de chaque au niveau 1, puis un de plus aux niveaux 6 et 14 (ennemis), 6 et 10 (terrains)', () => {
    expect(countsAt(1)).toEqual({ favored_enemy: 1, terrain: 1 })
    expect(countsAt(5)).toEqual({ favored_enemy: 1, terrain: 1 })
    expect(countsAt(6)).toEqual({ favored_enemy: 2, terrain: 2 })
    expect(countsAt(9)).toEqual({ favored_enemy: 2, terrain: 2 })
    expect(countsAt(10)).toEqual({ favored_enemy: 2, terrain: 3 })
    expect(countsAt(13)).toEqual({ favored_enemy: 2, terrain: 3 })
    expect(countsAt(14)).toEqual({ favored_enemy: 3, terrain: 3 })
    expect(countsAt(20)).toEqual({ favored_enemy: 3, terrain: 3 })
  })

  it('les choix sont des libellés, par le chemin générique des picks', () => {
    for (const c of resolveChoices({ classLevels: { [RANGER]: 1 } }, catalog).choices) expect(isPickChoice(c)).toBe(true)
  })
})

describe('choicesGainedAtLevelUp — un point de choix qui grandit', () => {
  it('ne revient qu\'avec son surplus, aux niveaux où il grandit', () => {
    expect(gained(5, 6)).toEqual(['favored_enemy:1/1', 'terrain:1/1'])
    expect(gained(6, 7)).toEqual([])
    expect(gained(9, 10)).toEqual(['terrain:1/1'])
    expect(gained(13, 14)).toEqual(['favored_enemy:1/1'])
    expect(gained(14, 15)).toEqual([])
  })

  it('rejoindre la classe par multiclassage donne le premier de chaque', () => {
    expect(gained(0, 1, { mainClassId: FIGHTER })).toEqual(['favored_enemy:1/1', 'terrain:1/1'])
  })
})

describe('contrat du seed', () => {
  it('les capacités du Rôdeur déclarent ces points de choix', () => {
    const progressionOf = (name: string) => rodeurFeatures.find(f => f.name === name)!.progression
    expect(progressionOf('Ennemi juré')).toEqual({ kind: 'favored_enemy', count: FAVORED_ENEMY_COUNT, optionSource: { type: 'enum', values: [...FAVORED_ENEMIES] } })
    expect(progressionOf('Explorateur-né')).toEqual({ kind: 'terrain', count: FAVORED_TERRAIN_COUNT, optionSource: { type: 'enum', values: [...FAVORED_TERRAINS] } })
  })

  it('les terrains du Rôdeur sont ceux du Cercle de la terre', () => {
    expect([...FAVORED_TERRAINS]).toEqual([...DRUID_TERRAINS])
  })

  it('treize types d\'ennemis, plus le choix de deux races d\'humanoïdes', () => {
    expect(FAVORED_ENEMIES).toHaveLength(14)
    expect(FAVORED_ENEMIES.at(-1)).toBe('Humanoïdes (deux races)')
  })
})

describe('choiceTitle', () => {
  it('distingue le terrain du Rôdeur de celui du cercle du Druide', () => {
    expect(choiceTitle({ kind: 'terrain', ownerSubclassId: 50 })).toBe('Terrain du cercle')
    expect(choiceTitle({ kind: 'terrain' })).toBe('Terrain favori')
    expect(choiceTitle({ kind: 'favored_enemy' })).toBe('Ennemi juré')
    expect(choiceTitle({ kind: 'skill' })).toBeUndefined()
  })
})
