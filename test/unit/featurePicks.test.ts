import { describe, it, expect } from 'vitest'
import { byFeaturePickOrder, featurePicksError, isFeaturePickChoice, optionFeatureIds } from '../../shared/rules/featurePicks'
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

  it('le style de combat de la classe, le pacte, les manifestations, la Métamagie et les manœuvres en sont ; les maîtrises, non', () => {
    for (const kind of ['fighting_style', 'additional_fighting_style', 'pact_boon', 'invocations', 'metamagic', 'maneuvers'] as const) {
      expect(isFeaturePickChoice({ kind })).toBe(true)
    }
    for (const kind of ['subclass', 'skill', 'tool', 'cantrip', 'terrain', 'asi_or_feat'] as const) {
      expect(isFeaturePickChoice({ kind })).toBe(false)
    }
  })
})

describe('byFeaturePickOrder', () => {
  it('met le pacte avant les manifestations qui en dépendent, quel que soit l\'ordre du catalogue', () => {
    const kinds = [{ kind: 'maneuvers' }, { kind: 'invocations' }, { kind: 'pact_boon' }, { kind: 'fighting_style' }] as const
    expect([...kinds].sort(byFeaturePickOrder).map(c => c.kind)).toEqual(['fighting_style', 'pact_boon', 'invocations', 'maneuvers'])
  })
})

describe('choicesGainedAtLevelUp — point de choix remplaçable à chaque niveau', () => {
  const WARLOCK = 6
  const invocations: CatalogProgression = {
    progressionId: 20,
    ownerClassId: WARLOCK,
    ownerLevelRequired: 2,
    kind: 'invocations',
    count: { op: 'lookup', table: [0, 2, 2, 2, 3, 3] },
    optionSource: { type: 'feature_group', group: 'invocation' },
    replaceable: true,
    options: [
      { featureId: 1 },
      { featureId: 2, levelRequired: 6 },
      { featureId: 3, prerequisites: { requiredPactBoon: 'blade' } },
    ],
  }
  const maneuvers: CatalogProgression = { ...invocations, progressionId: 21, kind: 'maneuvers', options: [{ featureId: 1 }] }
  const gained = (from: number, to: number, progressions = [invocations, maneuvers]) =>
    choicesGainedAtLevelUp({ progressions }, { classId: WARLOCK, fromLevel: from, toLevel: to, mainClassId: WARLOCK })
      .map(c => [c.kind, c.count, c.remaining])

  it('revient avec son surplus quand le niveau en donne', () => {
    expect(gained(1, 2)).toEqual([['invocations', 2, 2], ['maneuvers', 2, 2]])
  })

  it('reste ouvert, sans surplus, pour les manifestations quand le niveau n\'en donne pas — et pas pour les manœuvres', () => {
    expect(gained(2, 3)).toEqual([['invocations', 0, 0]])
    expect(gained(4, 5)).toEqual([['invocations', 1, 1], ['maneuvers', 1, 1]])
  })

  it('n\'est pas détenu avant le niveau qui le donne, ni quand on rejoint la classe', () => {
    expect(gained(0, 1)).toEqual([])
    expect(gained(1, 2, [{ ...invocations, ownerLevelRequired: 3 }])).toEqual([])
  })

  it('ne filtre les options que par niveau : le prérequis d\'état (pacte) reste à l\'interface', () => {
    const [choice] = choicesGainedAtLevelUp({ progressions: [invocations] }, { classId: WARLOCK, fromLevel: 4, toLevel: 5, mainClassId: WARLOCK })
    expect(optionFeatureIds(choice!)).toEqual([1, 3])
    const [later] = choicesGainedAtLevelUp({ progressions: [invocations] }, { classId: WARLOCK, fromLevel: 5, toLevel: 6, mainClassId: WARLOCK })
    expect(optionFeatureIds(later!)).toEqual([1, 2, 3])
    expect(later).toMatchObject({ count: 0, classLevel: 6 })
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

describe('featurePicksError — remplacer à un niveau qui ne donne aucune option', () => {
  const choice = (kind: ResolvedChoice['kind']): ResolvedChoice => ({
    progressionId: 9,
    ownerLevelRequired: 2,
    kind,
    classLevel: 6,
    count: 0,
    made: 0,
    remaining: 0,
    replaceable: true,
    optionSource: { type: 'feature_group', group: 'invocation' },
    options: [1, 2, 3, 4].map(featureId => ({ featureId })),
  })
  const pick = (featureId: number) => ({ progressionId: 9, featureId })
  const owned = new Set([1, 2])

  it('permis pour les manifestations : l\'option remplacée part, la nouvelle arrive', () => {
    expect(featurePicksError([pick(3)], [choice('invocations')], owned, [pick(1)])).toBeNull()
  })

  it('refusé pour les autres types remplaçables (manœuvres)', () => {
    expect(featurePicksError([pick(3)], [choice('maneuvers')], owned, [pick(1)])).toMatch(/rien à remplacer/)
  })

  it('une nouvelle option reste exigée, et la remplacée ne se reprend pas', () => {
    expect(featurePicksError([], [choice('invocations')], owned, [pick(1)])).toMatch(/exige une nouvelle option/)
    expect(featurePicksError([pick(1)], [choice('invocations')], owned, [pick(1)])).toMatch(/déjà prise/)
    expect(featurePicksError([pick(3), pick(4)], [choice('invocations')], owned, [pick(1)])).toMatch(/Trop de choix/)
  })
})
