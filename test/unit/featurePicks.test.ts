import { describe, it, expect } from 'vitest'
import { featurePicksError, isFeaturePickChoice, optionFeatureIds } from '../../shared/rules/featurePicks'
import { choicesGainedAtLevelUp, resolveChoices, type CatalogProgression, type ResolvedChoice } from '../../shared/rules/resolve'

// Choisir des options de feature (2ᵉ style de combat du Champion, manœuvres) : le point de choix dit combien et lesquelles ;
// une option que la fiche porte déjà ne se prend pas une seconde fois.

const FIGHTER = 5
const CHAMPION = 50
const MASTER = 51
const ARCHERY = 31
const DEFENSE = 32
const DUELING = 33

const additionalStyle: CatalogProgression = {
  progressionId: 7,
  ownerClassId: FIGHTER,
  ownerSubclassId: CHAMPION,
  ownerLevelRequired: 10,
  kind: 'additional_fighting_style',
  count: { op: 'fixed', value: 1 },
  optionSource: { type: 'feature_group', group: 'fighting_style' },
  replaceable: false,
  options: [ARCHERY, DEFENSE, DUELING].map(featureId => ({ featureId })),
}
const catalog = { progressions: [additionalStyle] }

const choiceAt = (level: number, subclassIds: number[]): ResolvedChoice =>
  resolveChoices({ classLevels: { [FIGHTER]: level }, subclassIds }, catalog).choices[0]!

describe('point de choix d\'option de feature', () => {
  it('dû au niveau 10 du Champion, avec les styles du Guerrier', () => {
    const choice = choiceAt(10, [CHAMPION])
    expect(choice).toMatchObject({ kind: 'additional_fighting_style', count: 1, remaining: 1 })
    expect(isFeaturePickChoice(choice)).toBe(true)
    expect(optionFeatureIds(choice)).toEqual([ARCHERY, DEFENSE, DUELING])
  })

  it('absent avant le niveau 10 et sans la sous-classe', () => {
    expect(resolveChoices({ classLevels: { [FIGHTER]: 9 }, subclassIds: [CHAMPION] }, catalog).choices).toEqual([])
    expect(resolveChoices({ classLevels: { [FIGHTER]: 10 }, subclassIds: [MASTER] }, catalog).choices).toEqual([])
    expect(resolveChoices({ classLevels: { [FIGHTER]: 10 } }, catalog).choices).toEqual([])
  })

  it('gagné en passant du niveau 9 au 10, une seule fois', () => {
    const gained = (from: number, to: number) => choicesGainedAtLevelUp(catalog, {
      classId: FIGHTER, fromLevel: from, toLevel: to, mainClassId: FIGHTER, subclassIdsBefore: [CHAMPION], subclassIdsAfter: [CHAMPION],
    }).map(c => c.kind)
    expect(gained(9, 10)).toEqual(['additional_fighting_style'])
    expect(gained(10, 11)).toEqual([])
  })

  it('les autres types de choix n\'en sont pas', () => {
    expect(isFeaturePickChoice({ kind: 'fighting_style' })).toBe(false)
    expect(isFeaturePickChoice({ kind: 'metamagic' })).toBe(false)
    expect(isFeaturePickChoice({ kind: 'maneuvers' })).toBe(true)
  })
})

describe('featurePicksError', () => {
  const choices = [choiceAt(10, [CHAMPION])]
  const pick = (featureId: number, progressionId = 7) => ({ progressionId, featureId })
  const none = new Set<number>()

  it('accepte une option proposée que la fiche ne porte pas', () => {
    expect(featurePicksError([pick(DEFENSE)], choices, new Set([DUELING]))).toBeNull()
    expect(featurePicksError([], choices, none)).toBeNull()
  })

  it('refuse une option que la fiche porte déjà : le 2ᵉ style diffère du premier', () => {
    expect(featurePicksError([pick(DUELING)], choices, new Set([DUELING]))).toMatch(/déjà prise/)
  })

  it('refuse une option hors du point de choix, un doublon, un excédent et un point de choix inconnu', () => {
    expect(featurePicksError([pick(999)], choices, none)).toMatch(/n'est pas proposée/)
    expect(featurePicksError([pick(ARCHERY), pick(ARCHERY)], choices, none)).toMatch(/deux fois|Trop de choix/)
    expect(featurePicksError([pick(ARCHERY), pick(DEFENSE)], choices, none)).toMatch(/Trop de choix/)
    expect(featurePicksError([pick(ARCHERY, 8)], choices, none)).toMatch(/n'est pas proposé/)
  })
})
